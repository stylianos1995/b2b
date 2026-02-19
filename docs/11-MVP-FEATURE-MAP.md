# Mini-MVP Feature Map

## Capabilities for first build (MVP only)

All capabilities map to existing Service Boundaries (09), Permission Model (08), and Event Flow Model (10). No new services, roles, or events.

---

## Feature map table

| Capability                                 | Service                  | Role(s)                                                                                      | Triggered Event(s)                 | Priority |
| ------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------- | -------- |
| Register (sign up)                         | Identity Service         | —                                                                                            | UserRegistered                     | MVP      |
| Login                                      | Identity Service         | —                                                                                            | —                                  | MVP      |
| Logout                                     | Identity Service         | Authenticated                                                                                | —                                  | MVP      |
| Refresh token                              | Identity Service         | Authenticated                                                                                | —                                  | MVP      |
| Get current user (me)                      | Identity Service         | Authenticated                                                                                | —                                  | MVP      |
| Forgot password                            | Identity Service         | —                                                                                            | —                                  | MVP      |
| Reset password                             | Identity Service         | —                                                                                            | —                                  | MVP      |
| Resolve principal (internal)               | Identity Service         | —                                                                                            | —                                  | MVP      |
| Create business                            | Business Service         | User (becomes BusinessOwner)                                                                 | BusinessCreated                    | MVP      |
| Get business profile                       | Business Service         | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Update business profile                    | Business Service         | BusinessOwner, BusinessManager                                                               | —                                  | MVP      |
| Add delivery address                       | Business Service         | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Get delivery addresses                     | Business Service         | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Create provider                            | Provider Service         | User (becomes ProviderOwner)                                                                 | ProviderVerified                   | MVP      |
| Get provider profile                       | Provider Service         | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Update provider profile                    | Provider Service         | ProviderOwner, ProviderManager                                                               | —                                  | MVP      |
| Add product                                | Provider Service         | ProviderOwner, ProviderManager, ProviderStaff                                                | ProductCreated                     | MVP      |
| Get products (catalog)                     | Provider Service         | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Update product                             | Provider Service         | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Add provider location                      | Provider Service         | ProviderOwner, ProviderManager                                                               | —                                  | MVP      |
| Get provider locations                     | Provider Service         | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Search providers (discovery)               | Search/Discovery Service | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Get provider public profile                | Search/Discovery Service | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Get provider catalog (for ordering)        | Search/Discovery Service | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Place order                                | Order Service            | BusinessOwner, BusinessManager, BusinessStaff                                                | OrderPlaced                        | MVP      |
| Get my orders (buyer)                      | Order Service            | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Get order by id (buyer)                    | Order Service            | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Confirm order                              | Order Service            | ProviderOwner, ProviderManager, ProviderStaff                                                | OrderConfirmed                     | MVP      |
| Reject order                               | Order Service            | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Update order status (preparing, shipped)   | Order Service            | ProviderOwner, ProviderManager, ProviderStaff                                                | OrderPrepared, OrderDispatched     | MVP      |
| Cancel order (buyer)                       | Order Service            | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| Get my orders (provider)                   | Order Service            | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Get order by id (provider)                 | Order Service            | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Create delivery (on order confirm)         | Logistics Service        | System (OrderConfirmed consumer)                                                             | —                                  | MVP      |
| Update delivery status                     | Logistics Service        | ProviderOwner, ProviderManager, ProviderStaff                                                | OrderDelivered (when delivered)    | MVP      |
| Get delivery (tracking)                    | Logistics Service        | BusinessOwner, BusinessManager, BusinessStaff; ProviderOwner, ProviderManager, ProviderStaff | —                                  | MVP      |
| Create and issue invoice                   | Payment Service          | ProviderOwner, ProviderManager, ProviderStaff                                                | InvoiceGenerated                   | MVP      |
| List invoices (buyer)                      | Payment Service          | BusinessOwner, BusinessManager, BusinessStaff                                                | —                                  | MVP      |
| List invoices (provider)                   | Payment Service          | ProviderOwner, ProviderManager, ProviderStaff                                                | —                                  | MVP      |
| Get invoice by id                          | Payment Service          | BusinessOwner, BusinessManager, BusinessStaff; ProviderOwner, ProviderManager, ProviderStaff | —                                  | MVP      |
| Pay invoice (initiate payment)             | Payment Service          | BusinessOwner, BusinessManager, BusinessStaff                                                | PaymentInitiated, PaymentCompleted | MVP      |
| Get payments (list)                        | Payment Service          | BusinessOwner, BusinessManager, BusinessStaff; ProviderOwner, ProviderManager, ProviderStaff | —                                  | MVP      |
| Submit rating (data collection)            | Trust Service            | BusinessOwner, BusinessManager, BusinessStaff                                                | RatingSubmitted                    | MVP      |
| Deliver notification (email, event-driven) | Notification Service     | System                                                                                       | —                                  | MVP      |
| List users                                 | Admin Service            | PlatformAdmin, PlatformOps                                                                   | —                                  | MVP      |
| List businesses                            | Admin Service            | PlatformAdmin, PlatformOps                                                                   | —                                  | MVP      |
| List providers                             | Admin Service            | PlatformAdmin, PlatformOps                                                                   | —                                  | MVP      |
| Update user status (active/suspended)      | Identity Service         | PlatformAdmin, PlatformOps                                                                   | —                                  | MVP      |
| Update business status (active/suspended)  | Business Service         | PlatformAdmin, PlatformOps                                                                   | —                                  | MVP      |
| Update provider status (active/suspended)  | Provider Service         | PlatformAdmin, PlatformOps                                                                   | ProviderVerified (when set active) | MVP      |
| Execute payout (manual)                    | Payment Service          | PlatformAdmin, PlatformFinance                                                               | PayoutExecuted                     | MVP      |

---

## Notes

- **One role per user in MVP:** Each user is either a buyer (one business) or a provider (one provider). No multi-entity or invite-member capabilities.
- **ProviderVerified:** Emitted when provider status becomes active (on create with auto-approve or when admin sets status via Provider API).
- **PaymentCompleted:** Emitted when payment gateway webhook confirms success; not by user action alone.
- **Deliver notification:** Notification Service consumes events (UserRegistered, OrderPlaced, OrderConfirmed, OrderDelivered, InvoiceGenerated, PaymentCompleted); no user-facing capability, listed as system function.
- **DisputeOpened / DisputeResolved:** Not in MVP; no dispute UI. Excluded from map.
- **Analytics, Recommendation, contracts, subscriptions, preferred suppliers:** Out of MVP scope; excluded.
