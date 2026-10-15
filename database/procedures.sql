-- ============================================================================
-- GATHERLY - STORED PROCEDURES
-- Procedure: sp_register_for_event
-- Purpose: Atomically registers a user for an event with capacity safety,
-- concurrency protection via pessimistic row locking (SELECT ... FOR UPDATE),
-- and duplicate check.
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_register_for_event;

DELIMITER //

CREATE PROCEDURE sp_register_for_event (
    IN p_user_id BIGINT,
    IN p_event_id BIGINT,
    OUT p_result_code VARCHAR(30),
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_event_capacity INT UNSIGNED;
    DECLARE v_event_status VARCHAR(20);
    DECLARE v_event_start DATETIME;
    DECLARE v_active_count INT DEFAULT 0;
    DECLARE v_existing_reg_id BIGINT DEFAULT NULL;
    DECLARE v_existing_status VARCHAR(20) DEFAULT NULL;

    -- Exit handler for unhandled SQL errors: rollback and return failure
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = 'SQL_ERROR';
        SET p_message = 'Internal database error during registration transaction.';
    END;

    -- 1. Begin atomic transaction
    START TRANSACTION;

    -- 2. Concurrency Safety: Lock the event row for UPDATE to serialize capacity checks
    SELECT capacity, status, start_at
    INTO v_event_capacity, v_event_status, v_event_start
    FROM events
    WHERE event_id = p_event_id
    FOR UPDATE;

    -- Check if event exists
    IF v_event_capacity IS NULL THEN
        ROLLBACK;
        SET p_result_code = 'NOT_FOUND';
        SET p_message = 'Event not found.';
        LEAVE proc_label;
    END IF;

    -- Validate event status
    IF v_event_status != 'published' THEN
        ROLLBACK;
        SET p_result_code = 'EVENT_NOT_PUBLISHED';
        SET p_message = CONCAT('Cannot register for event with status: ', v_event_status);
        LEAVE proc_label;
    END IF;

    -- Validate event date has not started
    IF v_event_start <= NOW() THEN
        ROLLBACK;
        SET p_result_code = 'EVENT_ALREADY_STARTED';
        SET p_message = 'Event has already started or concluded.';
        LEAVE proc_label;
    END IF;

    -- 3. Check existing user registration status for this event
    SELECT registration_id, status
    INTO v_existing_reg_id, v_existing_status
    FROM registrations
    WHERE user_id = p_user_id AND event_id = p_event_id
    FOR UPDATE;

    IF v_existing_reg_id IS NOT NULL AND v_existing_status = 'registered' THEN
        ROLLBACK;
        SET p_result_code = 'ALREADY_REGISTERED';
        SET p_message = 'User is already registered for this event.';
        LEAVE proc_label;
    END IF;

    -- 4. Calculate active registrations under current locked snapshot
    SELECT COUNT(*)
    INTO v_active_count
    FROM registrations
    WHERE event_id = p_event_id AND status = 'registered';

    -- 5. Capacity validation
    IF v_active_count >= v_event_capacity THEN
        ROLLBACK;
        SET p_result_code = 'EVENT_FULL';
        SET p_message = CONCAT('Event is at full capacity (', v_event_capacity, ' seats).');
        LEAVE proc_label;
    END IF;

    -- 6. Insert new registration or reactivate a previously cancelled record
    IF v_existing_reg_id IS NOT NULL THEN
        UPDATE registrations
        SET status = 'registered',
            registered_at = CURRENT_TIMESTAMP,
            cancelled_at = NULL
        WHERE registration_id = v_existing_reg_id;
    ELSE
        INSERT INTO registrations (user_id, event_id, status, registered_at)
        VALUES (p_user_id, p_event_id, 'registered', CURRENT_TIMESTAMP);
    END IF;

    -- 7. Commit transaction
    COMMIT;

    SET p_result_code = 'SUCCESS';
    SET p_message = 'Registration successfully completed.';
END //

DELIMITER ;
