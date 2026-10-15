# Gatherly — Entity Relationship (ER) Diagram & Relational Mapping

## 1. Conceptual & Logical ER Model

```mermaid
erDiagram
    USERS ||--o{ EVENTS : organizes
    CATEGORIES ||--o{ EVENTS : classifies
    VENUES ||--o{ EVENTS : hosts
    USERS ||--o{ REGISTRATIONS : places
    EVENTS ||--o{ REGISTRATIONS : receives
    USERS ||--o{ AUDIT_LOGS : performs
    EVENTS ||--o{ AUDIT_LOGS : audited_in

    USERS {
        bigint user_id PK "Auto Increment"
        varchar full_name "Not Null"
        varchar email UK "Unique, Indexed"
        varchar password_hash "Bcrypt Hash"
        enum role "attendee | admin"
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        bigint category_id PK "Auto Increment"
        varchar name UK "Unique Name"
        varchar slug UK "URL Friendly Key"
        text description
        datetime created_at
    }

    VENUES {
        bigint venue_id PK "Auto Increment"
        varchar name "Venue Name"
        varchar address "Physical Address"
        varchar city "Campus Zone"
        int capacity "Positive Integer"
        datetime created_at
    }

    EVENTS {
        bigint event_id PK "Auto Increment"
        bigint organizer_id FK "References users(user_id)"
        bigint category_id FK "References categories(category_id)"
        bigint venue_id FK "References venues(venue_id)"
        varchar title "Event Title"
        text description "Full Details"
        varchar image_url "Header Asset"
        datetime start_at "Indexed with status"
        datetime end_at "Check end_at > start_at"
        int capacity "Check capacity > 0"
        enum status "draft | published | cancelled | archived"
        datetime created_at
        datetime updated_at
    }

    REGISTRATIONS {
        bigint registration_id PK "Auto Increment"
        bigint user_id FK "References users(user_id)"
        bigint event_id FK "References events(event_id)"
        enum status "registered | cancelled"
        datetime registered_at
        datetime cancelled_at "Null if active"
        varchar notes
    }

    AUDIT_LOGS {
        bigint log_id PK "Auto Increment"
        varchar entity_name "e.g. events"
        bigint entity_id "ID of affected entity"
        varchar action "e.g. STATUS_CHANGE"
        json previous_state "Pre-update state"
        json new_state "Post-update state"
        bigint performed_by FK "References users(user_id)"
        datetime created_at
    }
```

## 2. Cardinalities & Relationship Rules
- **USERS to EVENTS (1:N)**: One user (administrator or campus organizer) can organize 0 or more events. Each event must have exactly one designated organizer (`ON DELETE RESTRICT`).
- **CATEGORIES to EVENTS (1:N)**: Each category classifies 0 or more events. Each event belongs to exactly one category (`ON DELETE RESTRICT`).
- **VENUES to EVENTS (1:N)**: Each physical venue can host multiple events over different time slots. Each event is assigned to one venue (`ON DELETE RESTRICT`).
- **USERS to EVENTS via REGISTRATIONS (M:N)**: An attendee can register for multiple events. An event can receive registrations from multiple attendees. This many-to-many relationship is resolved by the `registrations` associative entity with a composite business key `UNIQUE (user_id, event_id)`.
- **EVENTS to AUDIT_LOGS (1:N)**: Fired automatically by the database trigger `trg_event_status_audit` on lifecycle changes.

## 3. Normalization Justification
- **1NF (First Normal Form)**: All table attributes are atomic. No comma-delimited attendee lists or nested collections are stored in single cells.
- **2NF (Second Normal Form)**: All non-key attributes are fully functionally dependent on the entire primary key. In `registrations`, surrogate key `registration_id` is paired with `(user_id, event_id)` uniqueness.
- **3NF (Third Normal Form)**: No transitive dependencies exist between non-key attributes. Venue address, capacity, and organizer profiles are normalized in their respective tables rather than duplicated within `events`. Derived values like `remaining_capacity` and `occupancy_rate_pct` are dynamically computed in the `v_event_registration_summary` view rather than stored as redundant counters susceptible to desynchronization.
