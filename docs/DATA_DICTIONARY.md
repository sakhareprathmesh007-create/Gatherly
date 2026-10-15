# Gatherly — Data Dictionary

This document specifies table schemas, data types, nullability, defaults, key constraints, and business invariants for all relations in the Gatherly DBMS project.

---

### 1. Table: `users`
Stores system accounts for attendees and platform administrators.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|---|---|---|---|
| `user_id` | `BIGINT` | NO | Primary Key (Auto-Inc) | — | Unique user identifier |
| `full_name` | `VARCHAR(120)` | NO | None | — | User's full display name |
| `email` | `VARCHAR(191)` | NO | Unique (`uq_users_email`) | — | Trimmed, lowercase email address |
| `password_hash` | `VARCHAR(255)` | NO | None | — | Secure bcrypt password hash |
| `role` | `ENUM('attendee', 'admin')` | NO | None | `'attendee'` | Access level permissions |
| `avatar_url` | `VARCHAR(255)` | YES | None | `NULL` | Optional profile image link |
| `created_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP` | Account registration timestamp |
| `updated_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP ON UPDATE` | Last profile update timestamp |

---

### 2. Table: `categories`
Taxonomy tags used to classify and filter campus events.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|---|---|---|---|
| `category_id` | `BIGINT` | NO | Primary Key (Auto-Inc) | — | Unique category identifier |
| `name` | `VARCHAR(80)` | NO | Unique (`uq_categories_name`) | — | Display title of category |
| `slug` | `VARCHAR(80)` | NO | Unique (`uq_categories_slug`) | — | URL-safe slug |
| `description` | `TEXT` | YES | None | `NULL` | Detailed scope of the category |
| `created_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP` | Creation timestamp |

---

### 3. Table: `venues`
Campus and community facilities that host events.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|---|---|---|---|
| `venue_id` | `BIGINT` | NO | Primary Key (Auto-Inc) | — | Unique venue identifier |
| `name` | `VARCHAR(150)` | NO | None | — | Building or room name |
| `address` | `VARCHAR(255)` | NO | None | — | Physical street or campus address |
| `city` | `VARCHAR(100)` | NO | None | `'Campus'` | City or campus zone |
| `capacity` | `INT UNSIGNED` | NO | Check (`capacity > 0`) | — | Max architectural fire code capacity |
| `created_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP` | Record creation timestamp |

---

### 4. Table: `events`
Core scheduled event records.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|---|---|---|---|
| `event_id` | `BIGINT` | NO | Primary Key (Auto-Inc) | — | Unique event identifier |
| `organizer_id` | `BIGINT` | NO | Foreign Key (`users.user_id`) | — | Organizer administrator user |
| `category_id` | `BIGINT` | NO | Foreign Key (`categories.category_id`) | — | Event classification |
| `venue_id` | `BIGINT` | NO | Foreign Key (`venues.venue_id`) | — | Hosting location |
| `title` | `VARCHAR(200)` | NO | None | — | Event title |
| `description` | `TEXT` | NO | None | — | Long-form event description |
| `image_url` | `VARCHAR(255)` | YES | None | `NULL` | Asset image banner |
| `start_at` | `DATETIME` | NO | Index (`idx_events_status_start`) | — | Scheduled start timestamp |
| `end_at` | `DATETIME` | NO | Check (`end_at > start_at`) | — | Scheduled end timestamp |
| `capacity` | `INT UNSIGNED` | NO | Check (`capacity > 0`) | — | Registration limit |
| `status` | `ENUM(...)` | NO | `'published'` | — | `draft`, `published`, `cancelled`, `archived` |
| `created_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP` | Timestamp created |
| `updated_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP ON UPDATE` | Last status/field update |

---

### 5. Table: `registrations`
Associative entity tracking user event bookings.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|---|---|---|---|
| `registration_id` | `BIGINT` | NO | Primary Key (Auto-Inc) | — | Unique registration ID |
| `user_id` | `BIGINT` | NO | Foreign Key (`users.user_id`) | — | Registering user |
| `event_id` | `BIGINT` | NO | Foreign Key (`events.event_id`) | — | Target event |
| `status` | `ENUM('registered', 'cancelled')` | NO | Index (`idx_registrations_user_status`) | `'registered'` | Current registration state |
| `registered_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP` | Initial booking timestamp |
| `cancelled_at` | `DATETIME` | YES | None | `NULL` | Timestamp if cancelled |
| `notes` | `VARCHAR(255)` | YES | None | `NULL` | Optional dietary/attendee notes |

**Composite Constraint:** `UNIQUE KEY uq_registrations_user_event (user_id, event_id)` prevents simultaneous duplicate active seats.

---

### 6. Table: `audit_logs`
Automated transaction and lifecycle audit table populated by triggers.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
|---|---|---|---|---|---|
| `log_id` | `BIGINT` | NO | Primary Key (Auto-Inc) | — | Unique log record ID |
| `entity_name` | `VARCHAR(50)` | NO | Index (`idx_audit_entity`) | — | e.g. `'events'` |
| `entity_id` | `BIGINT` | NO | Index (`idx_audit_entity`) | — | Target entity primary key |
| `action` | `VARCHAR(50)` | NO | None | — | e.g. `'STATUS_CHANGE'` |
| `previous_state` | `JSON` | YES | None | `NULL` | Prior column values |
| `new_state` | `JSON` | YES | None | `NULL` | Updated column values |
| `performed_by` | `BIGINT` | YES | Foreign Key (`users.user_id`) | `NULL` | User initiating change |
| `created_at` | `DATETIME` | NO | None | `CURRENT_TIMESTAMP` | Timestamp of trigger execution |
