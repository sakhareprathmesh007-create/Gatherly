-- ============================================================================
-- GATHERLY - SEED DATA
-- Course Project: Relational Database Management System (DBMS)
-- Default Demo Credentials:
--   Admin:    admin@gatherly.local    / DemoAdmin123!
--   Attendee: maya.rao@example.test   / DemoAdmin123!
-- ============================================================================

-- Users (1 Admin, 5 Attendees)
INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES
(1, 'Aarav Mehta', 'admin@gatherly.local', '$2b$10$St.H47ITbAIaun2.yn9JQeYuRonoEJJzTfe6bMXosdxmr6TITow3m', 'admin'),
(2, 'Maya Rao', 'maya.rao@example.test', '$2b$10$St.H47ITbAIaun2.yn9JQeYuRonoEJJzTfe6bMXosdxmr6TITow3m', 'attendee'),
(3, 'Liam Chen', 'liam.chen@example.test', '$2b$10$St.H47ITbAIaun2.yn9JQeYuRonoEJJzTfe6bMXosdxmr6TITow3m', 'attendee'),
(4, 'Sofia Rodriguez', 'sofia.r@example.test', '$2b$10$St.H47ITbAIaun2.yn9JQeYuRonoEJJzTfe6bMXosdxmr6TITow3m', 'attendee'),
(5, 'Marcus Vance', 'marcus.v@example.test', '$2b$10$St.H47ITbAIaun2.yn9JQeYuRonoEJJzTfe6bMXosdxmr6TITow3m', 'attendee'),
(6, 'Priya Sharma', 'priya.s@example.test', '$2b$10$St.H47ITbAIaun2.yn9JQeYuRonoEJJzTfe6bMXosdxmr6TITow3m', 'attendee');

-- Categories (4 realistic categories)
INSERT INTO categories (category_id, name, slug, description) VALUES
(1, 'Technology & AI', 'technology-ai', 'Machine learning symposiums, software engineering roundtables, robotics labs, and developer conferences.'),
(2, 'Design & Creative Arts', 'design-creative', 'User experience workshops, architectural studios, graphic typography showcases, and creative prototyping.'),
(3, 'Music & Cultural', 'music-cultural', 'Acoustic evening concerts, campus cultural showcases, theatre performances, and community celebrations.'),
(4, 'Leadership & Careers', 'leadership-careers', 'Founder fireside chats, industry career panels, venture pitch nights, and professional networking.');

-- Venues (4 realistic campus & community locations)
INSERT INTO venues (venue_id, name, address, city, capacity) VALUES
(1, 'Grand Academic Hall', 'Building A, University Center, 500 University Ave', 'Central Campus', 250),
(2, 'Innovation Studio 4B', 'Design Hub, 4th Floor, 210 Foundry Way', 'North Quad', 45),
(3, 'Campus Amphitheater', 'Lakeside Lawn, West Pavilion Drive', 'West Campus', 180),
(4, 'Founders Executive Suite', 'School of Management, Room 102', 'East Campus', 60);

-- Events (8 scheduled events across categories with varying dates and capacities)
INSERT INTO events (event_id, organizer_id, category_id, venue_id, title, description, image_url, start_at, end_at, capacity, status) VALUES
(1, 1, 1, 1, 'Advancing Machine Learning in Real-Time Systems', 'Join faculty researchers and industry systems engineers as we dissect latency budgets, model pruning, and distributed inference benchmarks in high-throughput environments.', '/src/assets/images/event_tech_summit_1792071772901.jpg', '2026-10-25 14:00:00', '2026-10-25 17:30:00', 120, 'published'),

(2, 1, 2, 2, 'Design Systems & Component Architecture Studio', 'A hands-on Figma to production React workshop covering token architecture, accessibility audits (WCAG 2.2), and modular design constraints for large-scale web software.', '/src/assets/images/event_design_workshop_1792071774787.jpg', '2026-10-28 10:00:00', '2026-10-28 13:30:00', 30, 'published'),

(3, 1, 3, 3, 'Autumn Acoustic Harmony & Strings Showcase', 'An evening gathering at the outdoor lakeside amphitheater featuring campus student ensembles, cello/guitar duos, and original indie folk compositions under ambient string lights.', '/src/assets/images/event_music_acoustic_1792071774416.jpg', '2026-11-02 18:30:00', '2026-11-02 21:00:00', 150, 'published'),

(4, 1, 4, 4, 'Venture Pitch Night: Student & Alumni Founders', 'Six vetted student ventures present 5-minute technical pitches before an angel syndicate and venture capital partners. Followed by a catered networking reception.', '/src/assets/images/hero_event_crowd_1792071772839.jpg', '2026-11-06 17:00:00', '2026-11-06 20:00:00', 50, 'published'),

(5, 1, 1, 1, 'Autonomous Robotics & Vision Systems Expo', 'Live field demonstrations of student-built autonomous rovers, quadruped balancing control systems, and low-power stereo camera pipelines.', '/src/assets/images/event_tech_summit_1792071772901.jpg', '2026-11-12 11:00:00', '2026-11-12 15:00:00', 2, 'published'),

(6, 1, 2, 2, 'Micro-Typography & Editorial Publication Lab', 'Exploring grid geometry, optical kerning, and expressive responsive typography for digital readers and physical academic journals.', '/src/assets/images/event_design_workshop_1792071774787.jpg', '2026-11-16 13:00:00', '2026-11-16 16:00:00', 25, 'published'),

(7, 1, 3, 3, 'Global Rhythms: World Music & Percussion Guild', 'Percussion ensembles exploring polyrhythms, Latin Afro-Cuban beats, and Indian classical tabla interactions.', '/src/assets/images/event_music_acoustic_1792071774416.jpg', '2026-11-20 19:00:00', '2026-11-20 21:30:00', 100, 'published'),

(8, 1, 4, 4, 'Navigating Early Career Engineering Roles', 'Senior alumni software engineers from leading infrastructure and cloud firms share resume review tips, system design interview strategies, and salary negotiation insights.', '/src/assets/images/hero_event_crowd_1792071772839.jpg', '2026-11-25 16:00:00', '2026-11-25 18:30:00', 40, 'published');

-- Registrations (Mix of active registrations and cancelled history)
INSERT INTO registrations (registration_id, user_id, event_id, status, registered_at, cancelled_at) VALUES
(1, 2, 1, 'registered', '2026-10-16 09:15:00', NULL),
(2, 2, 2, 'registered', '2026-10-16 09:20:00', NULL),
(3, 3, 1, 'registered', '2026-10-16 11:45:00', NULL),
(4, 3, 5, 'registered', '2026-10-16 12:00:00', NULL),
(5, 4, 5, 'registered', '2026-10-16 12:15:00', NULL),
(6, 4, 3, 'registered', '2026-10-16 13:30:00', NULL),
(7, 5, 4, 'registered', '2026-10-16 14:10:00', NULL),
(8, 2, 4, 'cancelled', '2026-10-16 10:00:00', '2026-10-16 15:30:00');

-- Note: Event 5 (Autonomous Robotics) has capacity = 2 and active registrations = 2 (users 3 and 4).
-- This provides an immediate realistic test case for full-capacity rejection (HTTP 409 EVENT_FULL)!

-- Audit Logs (Seeded state changes)
INSERT INTO audit_logs (log_id, entity_name, entity_id, action, previous_state, new_state, performed_by, created_at) VALUES
(1, 'events', 1, 'STATUS_CHANGE', '{"status": "draft", "title": "Advancing Machine Learning in Real-Time Systems"}', '{"status": "published", "title": "Advancing Machine Learning in Real-Time Systems"}', 1, '2026-10-15 08:00:00'),
(2, 'events', 5, 'STATUS_CHANGE', '{"status": "draft", "title": "Autonomous Robotics & Vision Systems Expo"}', '{"status": "published", "title": "Autonomous Robotics & Vision Systems Expo"}', 1, '2026-10-15 08:30:00');
