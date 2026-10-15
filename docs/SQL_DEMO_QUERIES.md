# Gatherly — SQL Demo Queries & DBMS Concept Showcase

This catalog contains executable SQL statements demonstrating core DBMS concepts required for academic evaluation, viva examination, and production reporting.

---

### 1. Multi-Table Joins (INNER & LEFT JOIN)
Retrieve all published events with category metadata, hosting venue details, organizer names, and currently filled registrations.

```sql
SELECT 
    e.event_id,
    e.title,
    e.start_at,
    c.name AS category_name,
    v.name AS venue_name,
    v.capacity AS venue_capacity,
    e.capacity AS event_capacity,
    u.full_name AS organizer_name,
    COUNT(r.registration_id) AS active_registrations
FROM events e
INNER JOIN categories c ON e.category_id = c.category_id
INNER JOIN venues v ON e.venue_id = v.venue_id
INNER JOIN users u ON e.organizer_id = u.user_id
LEFT JOIN registrations r ON e.event_id = r.event_id AND r.status = 'registered'
WHERE e.status = 'published'
GROUP BY e.event_id, c.name, v.name, v.capacity, u.full_name
ORDER BY e.start_at ASC;
```

---

### 2. Aggregations, GROUP BY, and HAVING
Identify high-demand categories where average event occupancy exceeds 50%.

```sql
SELECT 
    c.category_id,
    c.name AS category_name,
    COUNT(DISTINCT e.event_id) AS total_events,
    SUM(e.capacity) AS total_seat_capacity,
    COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS total_booked_seats,
    ROUND(
        (COUNT(CASE WHEN r.status = 'registered' THEN 1 END) * 100.0) / NULLIF(SUM(e.capacity), 0),
        1
    ) AS category_occupancy_rate_pct
FROM categories c
INNER JOIN events e ON c.category_id = e.category_id
LEFT JOIN registrations r ON e.event_id = r.event_id
WHERE e.status = 'published'
GROUP BY c.category_id, c.name
HAVING total_booked_seats > 0
ORDER BY category_occupancy_rate_pct DESC;
```

---

### 3. Common Table Expressions (CTE) & Subqueries
Find the most active attendees who have registered for at least 2 distinct events across multiple venues.

```sql
WITH attendee_event_stats AS (
    SELECT 
        u.user_id,
        u.full_name,
        u.email,
        COUNT(DISTINCT r.event_id) AS events_attended,
        COUNT(DISTINCT e.venue_id) AS distinct_venues_visited
    FROM users u
    INNER JOIN registrations r ON u.user_id = r.user_id
    INNER JOIN events e ON r.event_id = e.event_id
    WHERE r.status = 'registered'
    GROUP BY u.user_id, u.full_name, u.email
)
SELECT * 
FROM attendee_event_stats
WHERE events_attended >= 2
ORDER BY events_attended DESC, full_name ASC;
```

---

### 4. Reusable Reporting Views
Querying the `v_event_registration_summary` view:

```sql
SELECT 
    event_id,
    title,
    category_name,
    venue_name,
    active_registrations,
    max_capacity,
    remaining_capacity,
    occupancy_rate_pct,
    is_full
FROM v_event_registration_summary
WHERE status = 'published'
ORDER BY remaining_capacity ASC;
```

---

### 5. Stored Procedure Invocation (Capacity-Safe Registration)
Calling `sp_register_for_event` with pessimistic row-locking (`SELECT ... FOR UPDATE`):

```sql
CALL sp_register_for_event(2, 3, @result_code, @message);
SELECT @result_code AS status, @message AS message;
```

---

### 6. Trigger Verification (Audit Status Change)
Demonstrating `trg_event_status_audit` inserting into `audit_logs`:

```sql
-- Step 1: Update event status
UPDATE events 
SET status = 'cancelled' 
WHERE event_id = 4;

-- Step 2: Verify trigger inserted audit record
SELECT 
    log_id,
    entity_name,
    entity_id,
    action,
    previous_state,
    new_state,
    created_at
FROM audit_logs
WHERE entity_name = 'events' AND entity_id = 4
ORDER BY created_at DESC
LIMIT 1;
```

---

### 7. Query Plan Analysis with EXPLAIN
Inspect index usage for event discovery filters:

```sql
EXPLAIN
SELECT event_id, title, start_at, capacity 
FROM events 
WHERE status = 'published' AND start_at >= '2026-10-01'
ORDER BY start_at ASC;
```
*Expected: Uses composite index `idx_events_status_start` for index scan without filesort.*
