-- ============================================================================
-- GATHERLY - DATABASE TRIGGERS
-- Trigger: trg_event_status_audit
-- Purpose: Automatically audits event status transitions (published, cancelled,
-- archived) into the audit_logs table on AFTER UPDATE without relying solely
-- on application code discipline.
-- ============================================================================

DROP TRIGGER IF EXISTS trg_event_status_audit;

DELIMITER //

CREATE TRIGGER trg_event_status_audit
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
    -- Only log when event status has actually transitioned
    IF OLD.status != NEW.status THEN
        INSERT INTO audit_logs (
            entity_name,
            entity_id,
            action,
            previous_state,
            new_state,
            performed_by,
            created_at
        ) VALUES (
            'events',
            NEW.event_id,
            'STATUS_CHANGE',
            JSON_OBJECT('status', OLD.status, 'title', OLD.title, 'capacity', OLD.capacity),
            JSON_OBJECT('status', NEW.status, 'title', NEW.title, 'capacity', NEW.capacity),
            NEW.organizer_id,
            NOW()
        );
    END IF;
END //

DELIMITER ;
