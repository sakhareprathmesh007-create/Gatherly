import React, { useState } from 'react';
import { X, Database, Layers, ShieldCheck, Terminal, Copy, Check, Code, GitCommit } from 'lucide-react';

interface DbmsExplorerModalProps {
  onClose: () => void;
}

export const DbmsExplorerModal: React.FC<DbmsExplorerModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'er' | 'schema' | 'views' | 'procedures' | 'triggers' | 'queries'>('er');
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in text-left">
      <div
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                DBMS Architectural Inspection Console
              </h2>
              <p className="text-xs text-slate-500">
                Course Project Technical Verification: MySQL 8.x, InnoDB, 3NF, Views, Stored Procedures & Triggers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="border-b border-stone-200 px-6 flex items-center gap-6 overflow-x-auto text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('er')}
            className={`py-3 border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === 'er' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. ER Model & 3NF Normalization
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === 'schema' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Schema & Constraints
          </button>
          <button
            onClick={() => setActiveTab('views')}
            className={`py-3 border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === 'views' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Reporting Views (v_event_registration_summary)
          </button>
          <button
            onClick={() => setActiveTab('procedures')}
            className={`py-3 border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === 'procedures' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            4. Stored Procedure (sp_register_for_event)
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`py-3 border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === 'triggers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            5. Audit Trigger (trg_event_status_audit)
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`py-3 border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === 'queries' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            6. SQL Demo Queries & EXPLAIN
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 leading-relaxed font-sans">
          {activeTab === 'er' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Relational Entities and Cardinalities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <p className="font-bold text-indigo-900">USERS (1:N) EVENTS</p>
                    <p className="text-slate-600">
                      One administrator or verified campus organizer schedules multiple events. Referential action <code>ON DELETE RESTRICT</code> prevents cascading deletion of active events.
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <p className="font-bold text-indigo-900">CATEGORIES (1:N) EVENTS</p>
                    <p className="text-slate-600">
                      Standardized taxonomy classification. Unique constraint on <code>name</code> and <code>slug</code>.
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <p className="font-bold text-indigo-900">VENUES (1:N) EVENTS</p>
                    <p className="text-slate-600">
                      Physical campus locations reused across events with independent architectural fire code capacity.
                    </p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <p className="font-bold text-indigo-900">USERS (M:N) EVENTS via REGISTRATIONS</p>
                    <p className="text-slate-600">
                      Associative entity with composite business key <code>UNIQUE(user_id, event_id)</code> enforcing at most one seat reservation per attendee.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Database Normalization Proof</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-stone-200 rounded-lg">
                    <p className="font-bold text-slate-900">1NF (First Normal Form)</p>
                    <p className="text-slate-600 mt-0.5">
                      All attributes contain atomic values. No multivalued attributes (e.g. comma-separated attendee IDs or category lists stored in a single text column).
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-stone-200 rounded-lg">
                    <p className="font-bold text-slate-900">2NF (Second Normal Form)</p>
                    <p className="text-slate-600 mt-0.5">
                      In 1NF and no partial dependencies exist on any composite candidate keys. In <code>registrations</code>, every non-key attribute (status, registered_at, cancelled_at) depends on the full key <code>(user_id, event_id)</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-stone-200 rounded-lg">
                    <p className="font-bold text-slate-900">3NF (Third Normal Form)</p>
                    <p className="text-slate-600 mt-0.5">
                      In 2NF and free of transitive functional dependencies ($X \to Y$ where $Y$ is non-prime and $X$ is not a superkey). Venue capacities and addresses are stored in <code>venues</code>, not copied repeatedly inside <code>events</code>. Derived fields like remaining capacity are calculated dynamically via views rather than stored as redundant mutable counters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Extracted directly from <code>database/schema.sql</code>. Uses InnoDB storage engine, foreign key constraints with referential integrity, and domain check constraints.
              </p>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-2xs leading-relaxed">
{`CREATE TABLE events (
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

CREATE TABLE registrations (
    registration_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    status ENUM('registered', 'cancelled') NOT NULL DEFAULT 'registered',
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at DATETIME DEFAULT NULL,
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    CONSTRAINT uq_registrations_user_event UNIQUE (user_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`}
              </pre>
            </div>
          )}

          {activeTab === 'views' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                View <code>v_event_registration_summary</code> joins 4 tables and computes aggregate occupancy and remaining capacity dynamically without storing redundant state.
              </p>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-2xs leading-relaxed">
{`CREATE VIEW v_event_registration_summary AS
SELECT 
    e.event_id,
    e.title,
    e.status,
    e.start_at,
    e.end_at,
    e.capacity AS max_capacity,
    c.name AS category_name,
    v.name AS venue_name,
    COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS active_registrations,
    GREATEST(0, CAST(e.capacity AS SIGNED) - CAST(COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS SIGNED)) AS remaining_capacity,
    ROUND((COUNT(CASE WHEN r.status = 'registered' THEN 1 END) * 100.0) / NULLIF(e.capacity, 0), 1) AS occupancy_rate_pct,
    CASE WHEN COUNT(CASE WHEN r.status = 'registered' THEN 1 END) >= e.capacity THEN 1 ELSE 0 END AS is_full
FROM events e
INNER JOIN categories c ON e.category_id = c.category_id
INNER JOIN venues v ON e.venue_id = v.venue_id
LEFT JOIN registrations r ON e.event_id = r.event_id
GROUP BY e.event_id, e.title, e.status, e.start_at, e.end_at, e.capacity, c.name, v.name;`}
              </pre>
            </div>
          )}

          {activeTab === 'procedures' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <p className="font-bold">Concurrency Control & Race Condition Mitigation</p>
                <p className="mt-0.5 text-amber-800">
                  Notice the critical <code>FOR UPDATE</code> clause on line 12. This acquires an exclusive row-level write lock in InnoDB, guaranteeing that two concurrent requests for the final seat execute serially rather than interleaving and creating an overbooking anomaly.
                </p>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-2xs leading-relaxed">
{`CREATE PROCEDURE sp_register_for_event (
    IN p_user_id BIGINT,
    IN p_event_id BIGINT,
    OUT p_result_code VARCHAR(30),
    OUT p_message VARCHAR(255)
)
BEGIN
    START TRANSACTION;

    -- Row-level lock on event record to serialize capacity validation
    SELECT capacity, status, start_at
    INTO v_event_capacity, v_event_status, v_event_start
    FROM events
    WHERE event_id = p_event_id
    FOR UPDATE;

    -- Duplicate check
    SELECT registration_id INTO v_existing_reg_id
    FROM registrations
    WHERE user_id = p_user_id AND event_id = p_event_id AND status = 'registered'
    FOR UPDATE;

    IF v_existing_reg_id IS NOT NULL THEN
        ROLLBACK;
        SET p_result_code = 'ALREADY_REGISTERED';
        LEAVE proc_label;
    END IF;

    -- Active capacity check
    SELECT COUNT(*) INTO v_active_count
    FROM registrations
    WHERE event_id = p_event_id AND status = 'registered';

    IF v_active_count >= v_event_capacity THEN
        ROLLBACK;
        SET p_result_code = 'EVENT_FULL';
        LEAVE proc_label;
    END IF;

    -- Commit transaction
    INSERT INTO registrations (user_id, event_id, status) VALUES (p_user_id, p_event_id, 'registered');
    COMMIT;
    SET p_result_code = 'SUCCESS';
END;`}
              </pre>
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Trigger <code>trg_event_status_audit</code> executes automatically in MySQL on <code>AFTER UPDATE ON events</code> whenever an event transitions between draft, published, cancelled, or archived states.
              </p>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-2xs leading-relaxed">
{`CREATE TRIGGER trg_event_status_audit
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
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
END;`}
              </pre>
            </div>
          )}

          {activeTab === 'queries' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Demonstrating joins, aggregations, GROUP BY, HAVING, and CTEs. Click "Copy SQL" to run directly in MySQL CLI or Workbench.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Query 1: High Demand Categories (GROUP BY & HAVING)</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `SELECT c.name, COUNT(DISTINCT e.event_id) AS events, SUM(e.capacity) AS total_cap, COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS bookings FROM categories c INNER JOIN events e ON c.category_id = e.category_id LEFT JOIN registrations r ON e.event_id = r.event_id WHERE e.status = 'published' GROUP BY c.category_id, c.name HAVING bookings > 0;`,
                          'q1'
                        )
                      }
                      className="text-2xs font-semibold text-indigo-600 flex items-center gap-1"
                    >
                      {copiedQuery === 'q1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedQuery === 'q1' ? 'Copied' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 text-slate-200 rounded font-mono text-2xs overflow-x-auto">
{`SELECT c.name, COUNT(DISTINCT e.event_id) AS events, SUM(e.capacity) AS total_cap,
       COUNT(CASE WHEN r.status = 'registered' THEN 1 END) AS bookings
FROM categories c
INNER JOIN events e ON c.category_id = e.category_id
LEFT JOIN registrations r ON e.event_id = r.event_id
WHERE e.status = 'published'
GROUP BY c.category_id, c.name
HAVING bookings > 0;`}
                  </pre>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Query 2: Active Attendees Across Venues (CTE & Subquery)</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `WITH stats AS (SELECT u.user_id, u.full_name, COUNT(DISTINCT r.event_id) AS events_attended, COUNT(DISTINCT e.venue_id) AS venues FROM users u INNER JOIN registrations r ON u.user_id = r.user_id INNER JOIN events e ON r.event_id = e.event_id WHERE r.status = 'registered' GROUP BY u.user_id, u.full_name) SELECT * FROM stats WHERE events_attended >= 2;`,
                          'q2'
                        )
                      }
                      className="text-2xs font-semibold text-indigo-600 flex items-center gap-1"
                    >
                      {copiedQuery === 'q2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedQuery === 'q2' ? 'Copied' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 text-slate-200 rounded font-mono text-2xs overflow-x-auto">
{`WITH stats AS (
  SELECT u.user_id, u.full_name,
         COUNT(DISTINCT r.event_id) AS events_attended,
         COUNT(DISTINCT e.venue_id) AS venues
  FROM users u
  INNER JOIN registrations r ON u.user_id = r.user_id
  INNER JOIN events e ON r.event_id = e.event_id
  WHERE r.status = 'registered'
  GROUP BY u.user_id, u.full_name
)
SELECT * FROM stats WHERE events_attended >= 2;`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-2xs text-slate-500 font-mono">
            Schema files available in /database/ (schema.sql, views.sql, procedures.sql, triggers.sql, seed.sql)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg shadow-2xs"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
