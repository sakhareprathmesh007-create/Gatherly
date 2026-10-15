-- ============================================================================
-- GATHERLY - DATABASE VIEWS
-- Academic Requirement: At least two reusable reporting views demonstrating
-- multi-table joins, derived aggregates, and clean abstraction.
-- ============================================================================

DROP VIEW IF EXISTS v_event_registration_summary;
DROP VIEW IF EXISTS v_user_registration_history;

-- ----------------------------------------------------------------------------
-- View 1: v_event_registration_summary
-- Summarizes capacity, active registered attendee counts, remaining seats,
-- and occupancy percentage across all events with venue & category metadata.
-- ----------------------------------------------------------------------------
CREATE VIEW v_event_registration_summary AS
SELECT 
    e.event_id,
    e.title,
    e.status,
    e.start_at,
    e.end_at,
    e.capacity AS max_capacity,
    c.category_id,
    c.name AS category_name,
    v.venue_id,
    v.name AS venue_name,
    v.city AS venue_city,
    u.user_id AS organizer_id,
    u.full_name AS organizer_name,
    COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS active_registrations,
    COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) AS cancelled_registrations,
    GREATEST(0, CAST(e.capacity AS SIGNED) - CAST(COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS SIGNED)) AS remaining_capacity,
    ROUND(
        (COUNT(CASE WHEN r.status = 'registered' THEN 1 END) * 100.0) / NULLIF(e.capacity, 0),
        1
    ) AS occupancy_rate_pct,
    CASE 
        WHEN COUNT(CASE WHEN r.status = 'registered' THEN 1 END) >= e.capacity THEN 1 
        ELSE 0 
    END AS is_full
FROM events e
INNER JOIN categories c ON e.category_id = c.category_id
INNER JOIN venues v ON e.venue_id = v.venue_id
INNER JOIN users u ON e.organizer_id = u.user_id
LEFT JOIN registrations r ON e.event_id = r.event_id
GROUP BY 
    e.event_id,
    e.title,
    e.status,
    e.start_at,
    e.end_at,
    e.capacity,
    c.category_id,
    c.name,
    v.venue_id,
    v.name,
    v.city,
    u.user_id,
    u.full_name;

-- ----------------------------------------------------------------------------
-- View 2: v_user_registration_history
-- Enriched attendee history view linking users, registrations, events,
-- venues, and categories. Useful for attendee dashboard and profile audit.
-- ----------------------------------------------------------------------------
CREATE VIEW v_user_registration_history AS
SELECT 
    r.registration_id,
    r.user_id,
    u.full_name AS attendee_name,
    u.email AS attendee_email,
    r.event_id,
    e.title AS event_title,
    e.description AS event_description,
    e.start_at AS event_start_at,
    e.end_at AS event_end_at,
    e.status AS event_status,
    c.name AS category_name,
    v.name AS venue_name,
    v.address AS venue_address,
    r.status AS registration_status,
    r.registered_at,
    r.cancelled_at,
    CASE 
        WHEN e.start_at > NOW() AND r.status = 'registered' THEN 'upcoming'
        WHEN e.start_at <= NOW() AND r.status = 'registered' THEN 'completed'
        ELSE 'cancelled'
    END AS computed_attendance_state
FROM registrations r
INNER JOIN users u ON r.user_id = u.user_id
INNER JOIN events e ON r.event_id = e.event_id
INNER JOIN categories c ON e.category_id = c.category_id
INNER JOIN venues v ON e.venue_id = v.venue_id;
