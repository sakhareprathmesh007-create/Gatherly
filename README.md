# Gatherly — Event Management System (DBMS Course Project)

Gatherly is a complete three-tier **Event Management System** engineered for an academic DBMS course project. The application demonstrates real-world relational database design, 3NF normalization, integrity constraints, multi-table joins, reporting views, a stored procedure with pessimistic row-locking for race condition mitigation, an audit trigger, and responsive attendee and admin portals.

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│  Presentation Tier (Client-Side)                       │
│  - React 19 + TypeScript + Vite                        │
│  - Tailwind CSS + Lucide Icons                         │
│  - Zero-Pill Design Discipline & Accessible Controls  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP REST / JSON
┌───────────────────────────▼────────────────────────────┐
│  Application Tier (Express + TypeScript API)           │
│  - Parameterized Queries & Zod Validation              │
│  - JWT Bearer Authentication & RBAC Middleware         │
│  - Transaction Boundary & Concurrency Control          │
└───────────────────────────┬────────────────────────────┘
                            │ InnoDB SQL / Transactions
┌───────────────────────────▼────────────────────────────┐
│  Data Tier (MySQL 8.x / InnoDB)                        │
│  - 6 Tables in 3NF (users, categories, venues,         │
│    events, registrations, audit_logs)                  │
│  - 2 Reusable Views (v_event_registration_summary)     │
│  - Stored Procedure (sp_register_for_event)            │
│  - Trigger (trg_event_status_audit)                    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Default Seed & Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@gatherly.local` | `DemoAdmin123!` | Create/edit events, publish/cancel/archive events, category management, view attendee lists, inspect audit logs |
| **Attendee** | `maya.rao@example.test` | `DemoAdmin123!` | Explore events, reserve seats via stored procedure, cancel seats, view registration history |

*A one-click demo login banner is provided inside the Sign In modal for immediate examination.*

---

## 3. Database Artefacts & Import Order

If importing into an external MySQL 8.x instance:

```bash
# 1. Schema, tables, constraints, and indexes
mysql -u root -p gatherly < database/schema.sql

# 2. Reusable multi-table reporting views
mysql -u root -p gatherly < database/views.sql

# 3. Capacity-safe registration stored procedure
mysql -u root -p gatherly < database/procedures.sql

# 4. Status transition audit trigger
mysql -u root -p gatherly < database/triggers.sql

# 5. Realistic initial seed data
mysql -u root -p gatherly < database/seed.sql
```

---

## 4. Key DBMS Concepts Demonstrated

| Concept | File / Implementation | Academic Rationale |
|---|---|---|
| **ER Modeling & 3NF** | `docs/ER_DIAGRAM.md`, `database/schema.sql` | Atomic fields (1NF), composite key independence (2NF), elimination of transitive dependencies (3NF). Venue and category metadata separated from events. |
| **Pessimistic Concurrency (`FOR UPDATE`)** | `database/procedures.sql`, `backend/db.ts` | Eliminates the classic "last seat race condition" where two concurrent users overbook a single remaining seat. Exclusive row lock serializes requests. |
| **Integrity Constraints** | `database/schema.sql` | `FOREIGN KEY ... ON DELETE RESTRICT`, `CHECK (capacity > 0)`, `CHECK (end_at > start_at)`, `UNIQUE (user_id, event_id)` preventing duplicate bookings. |
| **Reporting Views** | `database/views.sql` | `v_event_registration_summary` computes active registrations, remaining capacity, occupancy percentage, and full status without storing redundant counters. |
| **Database Triggers** | `database/triggers.sql` | `trg_event_status_audit` automatically audits event state changes into `audit_logs` table upon `AFTER UPDATE ON events`. |
| **Transactions (ACID)** | `database/procedures.sql` | Uses `START TRANSACTION`, `COMMIT`, and `ROLLBACK` handlers to ensure atomic seat reservation. |
| **Indexing Strategy** | `database/schema.sql` | Composite indexes `idx_events_status_start`, `idx_events_category_start`, `idx_registrations_event_status` tailored for filter and join query paths. |

---

## 5. Development Commands

```bash
# Install dependencies
npm install

# Start full-stack application (Express API on port 3000 + Vite middleware)
npm run dev

# Compile TypeScript and verify syntax
npm run lint

# Build production bundle
npm run build
```

---

## 6. REST API Endpoints Summary

- `GET /api/health`: Health status and relational table row counts.
- `GET /api/events`: Search and filter events with pagination and whitelisted sorting.
- `GET /api/events/:eventId`: Full event details with computed availability.
- `GET /api/categories`: Category taxonomy with active event counts.
- `GET /api/venues`: Campus facilities and seating capacities.
- `POST /api/auth/register`: Create new attendee account (bcrypt hash).
- `POST /api/auth/login`: Authenticate and issue JWT token.
- `GET /api/auth/me`: Authenticated user profile.
- `POST /api/events/:eventId/registrations`: Register seat via stored procedure logic.
- `DELETE /api/events/:eventId/registrations/me`: Cancel registration (preserves audit history).
- `GET /api/registrations/me`: Attendee booking history via `v_user_registration_history`.
- `GET /api/admin/overview`: Summary metric cards and recent trigger audit events.
- `GET /api/admin/events`: Full admin event inventory.
- `POST /api/admin/events`: Create new event with date validation.
- `PATCH /api/admin/events/:eventId`: Update event or status (fires audit trigger).
- `GET /api/admin/events/:eventId/registrations`: Attendee list for an event.
- `GET /api/admin/categories`: Category CRUD with referential restriction checks.
- `POST /api/admin/concurrency-test`: Dispatches 2 simultaneous requests for 1 remaining seat to prove transactional isolation.
