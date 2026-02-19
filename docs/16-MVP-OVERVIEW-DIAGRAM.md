# MVP System Overview — One-Page Diagram

## Layers, services, ownership, events, and flows

MVP-only. Aligned with Core Domain (00), Permission Model (08), Service Boundaries (09), Event Flow (10), Feature Map (11), API Skeleton (12), DB Schema (13), Integration Tests (14), CI/CD + Seed (15).

---

## Legend

| Symbol / Arrow | Meaning                                                          |
| -------------- | ---------------------------------------------------------------- |
| **→** (solid)  | Sync: API call or request/response                               |
| **⇢** (dashed) | Async: event emitted or consumed                                 |
| **Owner**      | Service that owns and writes the data (single writer)            |
| **Role**       | Allowed role(s) for API access (B=Buyer, P=Provider, A=Platform) |
| **DB**         | Table(s) owned by the service (from schema 13)                   |

**Roles (abbrev):** BO=BusinessOwner, BM=BusinessManager, BS=BusinessStaff | PO=ProviderOwner, PM=ProviderManager, PS=ProviderStaff | PA=PlatformAdmin, POps=PlatformOps, PFin=PlatformFinance

---

## Diagram 1: System layers (actors → API → services → data)

```mermaid
flowchart TB
  subgraph actors["ACTORS (Core Domain)"]
    Buyer["Buyer (Hospitality)"]
    Provider["Provider (Supplier)"]
    Platform["Platform Admin"]
  end

  subgraph api["API LAYER (v1)"]
    AuthAPI["/auth/*"]
    BizAPI["/businesses/*"]
    ProvAPI["/providers/*"]
    DiscAPI["/discovery/*"]
    OrdAPI["/buyer/orders, /provider/orders"]
    DelAPI["/deliveries/*"]
    PayAPI["/invoices, /payments"]
    RateAPI["/orders/:id/ratings"]
    AdminAPI["/admin/*"]
  end

  subgraph services["SERVICES + OWNED TABLES"]
    subgraph Identity["Identity Service [B,P,A]"]
      T1[("users\nbusiness_users\nprovider_users\nsessions")]
    end
    subgraph Business["Business Service [BO,BM,BS]"]
      T2[("businesses\nlocations(business)\npreferred_suppliers")]
    end
    subgraph Provider["Provider Service [PO,PM,PS]"]
      T3[("providers\nlocations(provider)\nproducts\navailability")]
    end
    subgraph Order["Order Service [B: BO,BM,BS | P: PO,PM,PS]"]
      T4[("orders\norder_lines")]
    end
    subgraph Logistics["Logistics Service [PO,PM,PS | B: read]"]
      T5[("deliveries")]
    end
    subgraph Payment["Payment Service [B | P | A:PFin]"]
      T6[("invoices\ninvoice_lines\npayments")]
    end
    subgraph Trust["Trust Service [BO,BM,BS]"]
      T7[("ratings")]
    end
    subgraph Search["Search/Discovery [BO,BM,BS]"]
      Idx[("index: providers\nproducts")]
    end
    subgraph Notif["Notification Service [system]"]
      Pref[("preferences\noutbound_log")]
    end
    subgraph Admin["Admin Service [PA, POps, PFin]"]
      Adm[("disputes\nconfig\naudit_log")]
    end
  end

  Buyer --> AuthAPI
  Buyer --> BizAPI
  Buyer --> DiscAPI
  Buyer --> OrdAPI
  Buyer --> DelAPI
  Buyer --> PayAPI
  Buyer --> RateAPI
  Provider --> AuthAPI
  Provider --> ProvAPI
  Provider --> OrdAPI
  Provider --> DelAPI
  Provider --> PayAPI
  Platform --> AdminAPI

  AuthAPI --> Identity
  BizAPI --> Business
  ProvAPI --> Provider
  DiscAPI --> Search
  OrdAPI --> Order
  DelAPI --> Logistics
  PayAPI --> Payment
  RateAPI --> Trust
  AdminAPI --> Admin
  Admin -.-> Identity
  Admin -.-> Business
  Admin -.-> Provider
  Admin -.-> Payment

  Order --> Business
  Order --> Provider
  Search --> Provider
  Search --> Trust
  Payment --> Order
```

---

## Diagram 2: Event flow (producers → consumers)

```mermaid
flowchart LR
  subgraph producers["PRODUCERS"]
    Id["Identity"]
    Biz["Business"]
    Prov["Provider"]
    Ord["Order"]
    Log["Logistics"]
    Pay["Payment"]
    Trust["Trust"]
    Adm["Admin"]
  end

  subgraph bus["EVENT BUS"]
    E1[UserReg]
    E2[BizCreated]
    E3[ProvVerified]
    E4[ProdCreated]
    E5[OrderPlaced]
    E6[OrderConfirmed]
    E7[OrderPrep]
    E8[OrderDispatched]
    E9[OrderDelivered]
    E10[InvGenerated]
    E11[PayCompleted]
    E12[PayoutExec]
    E13[RatingSubmitted]
  end

  subgraph consumers["CONSUMERS"]
    Notif["Notification"]
    Search["Search/Discovery"]
    LogC["Logistics"]
    OrdC["Order"]
    PayC["Payment"]
    TrustC["Trust"]
  end

  Id -->|⇢| E1
  Biz -->|⇢| E2
  Prov -->|⇢| E3
  Prov -->|⇢| E4
  Ord -->|⇢| E5
  Ord -->|⇢| E6
  Ord -->|⇢| E7
  Ord -->|⇢| E8
  Log -->|⇢| E9
  Pay -->|⇢| E10
  Pay -->|⇢| E11
  Pay -->|⇢| E12
  Trust -->|⇢| E13

  E1 --> Notif
  E2 --> Notif
  E3 --> Notif
  E3 --> Search
  E4 --> Search
  E5 --> Notif
  E6 --> Notif
  E6 --> LogC
  E7 --> Notif
  E8 --> Notif
  E9 --> Notif
  E9 --> OrdC
  E9 --> PayC
  E9 --> TrustC
  E10 --> Notif
  E11 --> Notif
  E12 --> Notif
  E13 --> TrustC
```

**Event shorthand:** UserReg=UserRegistered, BizCreated=BusinessCreated, ProvVerified=ProviderVerified, ProdCreated=ProductCreated, OrderPlaced/Confirmed/Prep/Dispatched/Delivered, InvGenerated=InvoiceGenerated, PayCompleted=PaymentCompleted, PayoutExec=PayoutExecuted, RatingSubmitted.

---

## Diagram 3: Order lifecycle (sync + async)

```mermaid
sequenceDiagram
  participant B as Buyer (BO/BM/BS)
  participant API as API
  participant Ord as Order Service
  participant Biz as Business
  participant Prov as Provider
  participant Log as Logistics
  participant Pay as Payment
  participant Evt as Event Bus
  participant Notif as Notification

  B->>API: POST /buyer/orders
  API->>Ord: place order (sync)
  Ord->>Biz: validate location (sync)
  Ord->>Prov: product snapshot (sync)
  Ord->>Ord: create order, emit OrderPlaced
  Ord->>Evt: OrderPlaced
  Evt->>Notif: notify provider
  API-->>B: 201 order_id

  B->>API: (provider) POST /provider/orders/:id/confirm
  API->>Ord: confirm
  Ord->>Ord: emit OrderConfirmed
  Ord->>Evt: OrderConfirmed
  Evt->>Log: create delivery
  Evt->>Notif: notify buyer
  API-->>B: 200

  B->>API: PATCH /deliveries/:id status=delivered
  API->>Log: update delivery
  Log->>Evt: OrderDelivered
  Evt->>Ord: set order delivered
  Evt->>Pay: auto-invoice (optional)
  Evt->>Notif: notify buyer
  Evt->>Trust: rateable + on-time metric
```

---

## Diagram 4: Data ownership (service → tables)

```mermaid
flowchart LR
  subgraph Identity["Identity"]
    A1[users]
    A2[business_users]
    A3[provider_users]
    A4[sessions]
  end

  subgraph Business["Business"]
    B1[businesses]
    B2[locations]
    B3[preferred_suppliers]
  end

  subgraph Provider["Provider"]
    P1[providers]
    P2[locations]
    P3[products]
    P4[availability]
  end

  subgraph Order["Order"]
    O1[orders]
    O2[order_lines]
  end

  subgraph Logistics["Logistics"]
    L1[deliveries]
  end

  subgraph Payment["Payment"]
    Y1[invoices]
    Y2[invoice_lines]
    Y3[payments]
  end

  subgraph Trust["Trust"]
    R1[ratings]
  end

  Order --> Business
  Order --> Provider
  Order --> Logistics
  Payment --> Order
  Trust --> Order
```

---

## Diagram 5: CI/CD + seed (annotation)

```mermaid
flowchart LR
  subgraph ci["CI Pipeline"]
    Lint["Lint / Format"]
    Type["Typecheck"]
    Mig["Migrate DB"]
    Contract["Contract"]
    Test["Unit + Integration"]
    Build["Build"]
  end

  subgraph deploy["Deploy"]
    Staging["Staging"]
    Prod["Production"]
  end

  subgraph seed["Seed (post-migrate)"]
    SeedDB["Seed: users, business,\nprovider, products,\norder, invoice, payment"]
  end

  Lint --> Type --> Mig --> Contract --> Test --> Build
  Build --> Staging
  Staging --> Prod
  Mig -.-> SeedDB
```

**Triggers:** PR → Validate + Migrate + Test + Build; Merge to main → + Deploy Staging; Production → manual. Seed: idempotent script after migrations (local / CI test DB).

---

## Summary table (MVP)

| Layer                | MVP contents                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Actors**           | Buyer (hospitality), Provider (supplier), Platform Admin                                                                                                                                                                                                                                            |
| **Roles**            | BusinessOwner/Manager/Staff, ProviderOwner/Manager/Staff, PlatformAdmin/Ops/Finance                                                                                                                                                                                                                 |
| **Core services**    | Identity, Business, Provider, Order, Logistics, Payment, Trust                                                                                                                                                                                                                                      |
| **Support services** | Search/Discovery, Notification, Admin                                                                                                                                                                                                                                                               |
| **API**              | /auth, /businesses, /providers, /discovery, /buyer                                                                                                                                                                                                                                                  | provider/orders, /deliveries, /invoices, /payments, /ratings, /admin |
| **Events (MVP)**     | UserRegistered, BusinessCreated, ProviderVerified, ProductCreated, OrderPlaced, OrderConfirmed, OrderPrepared, OrderDispatched, OrderDelivered, InvoiceGenerated, PaymentCompleted, PayoutExecuted, RatingSubmitted                                                                                 |
| **DB (owner)**       | Identity → users, business_users, provider_users, sessions; Business → businesses, locations(b), preferred_suppliers; Provider → providers, locations(p), products, availability; Order → orders, order_lines; Logistics → deliveries; Payment → invoices, invoice_lines, payments; Trust → ratings |
| **Flows**            | Register → Business/Provider → Discovery → Place order → Confirm → Delivery → Invoice → Pay → Rate; permissions enforced per role; failure paths (403/404/409) per Integration Test Plan                                                                                                            |
