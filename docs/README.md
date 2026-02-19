# B2B Hospitality Marketplace – System Design

Technical system design for a two-sided marketplace connecting hospitality businesses (buyers) with suppliers/providers. Implementation-oriented; no marketing content.

## Document Index

| #   | Document                                                     | Contents                                                                                                                                                     |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | [01-ENTITIES-AND-MODELS.md](./01-ENTITIES-AND-MODELS.md)     | Core entities (User, Business, Provider, Product, Order, Delivery, Invoice, Payment, etc.), fields, relationships                                            |
| 2   | [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)                   | Frontend (web/mobile/admin), backend, API, DB, auth, RBAC, real-time, notifications, payments, admin                                                         |
| 3   | [03-USER-FLOWS.md](./03-USER-FLOWS.md)                       | Flows for buyers (onboarding, discovery, ordering, payments, recurring, disputes) and providers (onboarding, catalog, orders, logistics, invoicing, payouts) |
| 4   | [04-MVP-AND-VERSIONS.md](./04-MVP-AND-VERSIONS.md)           | MVP scope, V1 production scope, V2 scaling scope                                                                                                             |
| 5   | [05-TECH-STACK.md](./05-TECH-STACK.md)                       | Frontend, backend, database, auth, payments, maps, notifications, hosting, CI/CD, analytics                                                                  |
| 6   | [06-BUSINESS-LOGIC.md](./06-BUSINESS-LOGIC.md)               | Rules for pricing, availability, cancellation, refunds, disputes, ranking, trust score, reliability, invoicing, payouts                                      |
| 7   | [07-ROADMAP.md](./07-ROADMAP.md)                             | Phases 1–6: concept, design, MVP build, pilot, scaling, monetization; goals and checkpoints                                                                  |
| 8   | [08-PERMISSION-MODEL.md](./08-PERMISSION-MODEL.md)           | Roles, access scopes, permissions per role, authority boundaries, data visibility, control points, design rules                                              |
| 9   | [09-SERVICE-BOUNDARIES.md](./09-SERVICE-BOUNDARIES.md)       | Core and support services, owned data, APIs, dependencies, external integrations, data ownership, boundary rules                                             |
| 10  | [10-EVENT-FLOW-MODEL.md](./10-EVENT-FLOW-MODEL.md)           | Core events, producers, consumers, sync vs async, failure handling, idempotency, ordering, versioning, traceability                                          |
| 11  | [11-MVP-FEATURE-MAP.md](./11-MVP-FEATURE-MAP.md)             | Mini-MVP capability list: capability, service, role(s), triggered events, priority (MVP only)                                                                |
| 12  | [12-MVP-API-SKELETON.md](./12-MVP-API-SKELETON.md)           | MVP API skeleton: HTTP method, endpoint, request/response fields, roles, triggered events                                                                    |
| 13  | [13-MVP-DB-SCHEMA.md](./13-MVP-DB-SCHEMA.md)                 | MVP DB schema: tables, ownership, FKs, indexes, PostgreSQL CREATE/ALTER, optional seed data                                                                  |
| 14  | [14-MVP-INTEGRATION-TESTS.md](./14-MVP-INTEGRATION-TESTS.md) | MVP integration test plan: scenarios by capability, success/failure paths, roles, events, E2E, preconditions                                                 |
| 15  | [15-MVP-CI-CD-SEED.md](./15-MVP-CI-CD-SEED.md)               | MVP CI/CD pipeline (lint, typecheck, migrate, contract, test, build, deploy, rollback) and idempotent DB seed script                                         |
| 16  | [16-MVP-OVERVIEW-DIAGRAM.md](./16-MVP-OVERVIEW-DIAGRAM.md)   | One-page MVP overview: layers, actors, services, API, events, DB ownership, order flow, CI/CD (Mermaid)                                                      |
| 18  | [18-MVP-PROJECT-SKELETON.md](./18-MVP-PROJECT-SKELETON.md)   | NestJS/TypeScript project skeleton: structure, package.json, main.ts, entities, modules, controllers, events, migrations, seeds, tests                       |

## Quick Reference

- **Two sides:** Hospitality businesses (buyers) and suppliers/providers (sellers).
- **Core flow:** Discover providers → browse catalog → place order → provider confirms → delivery → invoice → payment.
- **MVP:** Single role per user, one business/provider, products only, manual invoice and payouts, email notifications, no recurring orders or disputes UI.
- **Stack (MVP):** Next.js, TypeScript, PostgreSQL, Redis, Auth0/Clerk, Stripe, single backend service.
