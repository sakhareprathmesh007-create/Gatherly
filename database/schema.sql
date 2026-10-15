-- ============================================================================
-- GATHERLY - EVENT MANAGEMENT SYSTEM
-- Course Project: Relational Database Management System (DBMS)
-- Target DBMS: MySQL 8.x (InnoDB Engine, utf8mb4)
-- Normalization: 3NF (Atomic values, primary keys, transitive dependencies eliminated)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Table: users
-- Represents system users: Attendees and Administrators.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('attendee', 'admin') NOT NULL DEFAULT 'attendee',
    avatar_url VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_email_format CHECK (email LIKE '%_@__%.__%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Table: categories
-- Classifies events into academic, social, professional, and cultural types.
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(80) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Table: venues
-- Physical or hybrid physical locations where events take place.
-- ----------------------------------------------------------------------------
CREATE TABLE venues (
    venue_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Campus',
    capacity INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_venues_capacity_positive CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Table: events
-- Central entity holding scheduled campus and community events.
-- ----------------------------------------------------------------------------
CREATE TABLE events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organizer_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    venue_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    capacity INT UNSIGNED NOT NULL,
    status ENUM('draft', 'published', 'cancelled', 'archived') NOT NULL DEFAULT 'published',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE RESTRICT,
    CONSTRAINT chk_events_time_order CHECK (end_at > start_at),
    CONSTRAINT chk_events_capacity_positive CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table: registrations
-- Associative entity resolving M:N between users and events.
-- Business rule: At most one active registration record per user per event.
-- ----------------------------------------------------------------------------
CREATE TABLE registrations (
    registration_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    status ENUM('registered', 'cancelled') NOT NULL DEFAULT 'registered',
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME DEFAULT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT uq_registrations_user_event UNIQUE (user_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table: audit_logs
-- Tracks administrative actions, trigger firings, and event lifecycle changes.
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_name VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_state JSON DEFAULT NULL,
    new_state JSON DEFAULT NULL,
    performed_by BIGINT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- INDEXES
-- Strategically created based on high-frequency query patterns:
-- - Finding published events filtered by date range and category
-- - Fast lookups of active registrations for capacity checks
-- - Attendee dashboard history sorted by registration timestamp
-- ----------------------------------------------------------------------------
CREATE INDEX idx_events_status_start ON events(status, start_at);
CREATE INDEX idx_events_category_start ON events(category_id, start_at);
CREATE INDEX idx_registrations_event_status ON registrations(event_id, status);
CREATE INDEX idx_registrations_user_status ON registrations(user_id, status);
CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
