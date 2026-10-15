/**
 * Relational Database Management Layer for Gatherly
 * Implements 3NF relational model, constraints, transactions,
 * view calculations, stored procedure emulation, and triggers.
 */

import bcrypt from 'bcryptjs';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'attendee' | 'admin';
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface Venue {
  venue_id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  created_at: string;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';

export interface EventRecord {
  event_id: number;
  organizer_id: number;
  category_id: number;
  venue_id: number;
  title: string;
  description: string;
  image_url: string;
  start_at: string;
  end_at: string;
  capacity: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export type RegistrationStatus = 'registered' | 'cancelled';

export interface Registration {
  registration_id: number;
  user_id: number;
  event_id: number;
  status: RegistrationStatus;
  registered_at: string;
  cancelled_at: string | null;
  notes?: string | null;
}

export interface AuditLog {
  log_id: number;
  entity_name: string;
  entity_id: number;
  action: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  performed_by: number | null;
  ip_address?: string | null;
  created_at: string;
}

class GatherlyDatabase {
  users: User[] = [];
  categories: Category[] = [];
  venues: Venue[] = [];
  events: EventRecord[] = [];
  registrations: Registration[] = [];
  auditLogs: AuditLog[] = [];

  private nextUserId = 1;
  private nextCategoryId = 1;
  private nextVenueId = 1;
  private nextEventId = 1;
  private nextRegId = 1;
  private nextLogId = 1;

  // Mutex lock to simulate database row-locking (SELECT ... FOR UPDATE) during transactions
  private eventLocks: Map<number, Promise<void>> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Users
    const defaultHash = bcrypt.hashSync('DemoAdmin123!', 10);

    this.users = [
      {
        user_id: 1,
        full_name: 'Aarav Mehta',
        email: 'admin@gatherly.local',
        password_hash: defaultHash,
        role: 'admin',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        user_id: 2,
        full_name: 'Maya Rao',
        email: 'maya.rao@example.test',
        password_hash: defaultHash,
        role: 'attendee',
        created_at: '2026-10-15T08:05:00Z',
        updated_at: '2026-10-15T08:05:00Z',
      },
      {
        user_id: 3,
        full_name: 'Liam Chen',
        email: 'liam.chen@example.test',
        password_hash: defaultHash,
        role: 'attendee',
        created_at: '2026-10-15T08:10:00Z',
        updated_at: '2026-10-15T08:10:00Z',
      },
      {
        user_id: 4,
        full_name: 'Sofia Rodriguez',
        email: 'sofia.r@example.test',
        password_hash: defaultHash,
        role: 'attendee',
        created_at: '2026-10-15T08:15:00Z',
        updated_at: '2026-10-15T08:15:00Z',
      },
      {
        user_id: 5,
        full_name: 'Marcus Vance',
        email: 'marcus.v@example.test',
        password_hash: defaultHash,
        role: 'attendee',
        created_at: '2026-10-15T08:20:00Z',
        updated_at: '2026-10-15T08:20:00Z',
      },
      {
        user_id: 6,
        full_name: 'Priya Sharma',
        email: 'priya.s@example.test',
        password_hash: defaultHash,
        role: 'attendee',
        created_at: '2026-10-15T08:25:00Z',
        updated_at: '2026-10-15T08:25:00Z',
      },
    ];
    this.nextUserId = 7;

    // 2. Seed Categories
    this.categories = [
      {
        category_id: 1,
        name: 'Technology & AI',
        slug: 'technology-ai',
        description: 'Machine learning symposiums, software engineering roundtables, robotics labs, and developer conferences.',
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        category_id: 2,
        name: 'Design & Creative Arts',
        slug: 'design-creative',
        description: 'User experience workshops, architectural studios, graphic typography showcases, and creative prototyping.',
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        category_id: 3,
        name: 'Music & Cultural',
        slug: 'music-cultural',
        description: 'Acoustic evening concerts, campus cultural showcases, theatre performances, and community celebrations.',
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        category_id: 4,
        name: 'Leadership & Careers',
        slug: 'leadership-careers',
        description: 'Founder fireside chats, industry career panels, venture pitch nights, and professional networking.',
        created_at: '2026-10-15T08:00:00Z',
      },
    ];
    this.nextCategoryId = 5;

    // 3. Seed Venues
    this.venues = [
      {
        venue_id: 1,
        name: 'Grand Academic Hall',
        address: 'Building A, University Center, 500 University Ave',
        city: 'Central Campus',
        capacity: 250,
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        venue_id: 2,
        name: 'Innovation Studio 4B',
        address: 'Design Hub, 4th Floor, 210 Foundry Way',
        city: 'North Quad',
        capacity: 45,
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        venue_id: 3,
        name: 'Campus Amphitheater',
        address: 'Lakeside Lawn, West Pavilion Drive',
        city: 'West Campus',
        capacity: 180,
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        venue_id: 4,
        name: 'Founders Executive Suite',
        address: 'School of Management, Room 102',
        city: 'East Campus',
        capacity: 60,
        created_at: '2026-10-15T08:00:00Z',
      },
    ];
    this.nextVenueId = 5;

    // 4. Seed Events
    this.events = [
      {
        event_id: 1,
        organizer_id: 1,
        category_id: 1,
        venue_id: 1,
        title: 'Advancing Machine Learning in Real-Time Systems',
        description: 'Join faculty researchers and industry systems engineers as we dissect latency budgets, model pruning, and distributed inference benchmarks in high-throughput environments.',
        image_url: '/src/assets/images/event_tech_summit_1792071772901.jpg',
        start_at: '2026-10-25T14:00:00Z',
        end_at: '2026-10-25T17:30:00Z',
        capacity: 120,
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        event_id: 2,
        organizer_id: 1,
        category_id: 2,
        venue_id: 2,
        title: 'Design Systems & Component Architecture Studio',
        description: 'A hands-on Figma to production React workshop covering token architecture, accessibility audits (WCAG 2.2), and modular design constraints for large-scale web software.',
        image_url: '/src/assets/images/event_design_workshop_1792071774787.jpg',
        start_at: '2026-10-28T10:00:00Z',
        end_at: '2026-10-28T13:30:00Z',
        capacity: 30,
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        event_id: 3,
        organizer_id: 1,
        category_id: 3,
        venue_id: 3,
        title: 'Autumn Acoustic Harmony & Strings Showcase',
        description: 'An evening gathering at the outdoor lakeside amphitheater featuring campus student ensembles, cello/guitar duos, and original indie folk compositions under ambient string lights.',
        image_url: '/src/assets/images/event_music_acoustic_1792071774416.jpg',
        start_at: '2026-11-02T18:30:00Z',
        end_at: '2026-11-02T21:00:00Z',
        capacity: 150,
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        event_id: 4,
        organizer_id: 1,
        category_id: 4,
        venue_id: 4,
        title: 'Venture Pitch Night: Student & Alumni Founders',
        description: 'Six vetted student ventures present 5-minute technical pitches before an angel syndicate and venture capital partners. Followed by a catered networking reception.',
        image_url: '/src/assets/images/hero_event_crowd_1792071772839.jpg',
        start_at: '2026-11-06T17:00:00Z',
        end_at: '2026-11-06T20:00:00Z',
        capacity: 50,
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        event_id: 5,
        organizer_id: 1,
        category_id: 1,
        venue_id: 1,
        title: 'Autonomous Robotics & Vision Systems Expo',
        description: 'Live field demonstrations of student-built autonomous rovers, quadruped balancing control systems, and low-power stereo camera pipelines.',
        image_url: '/src/assets/images/event_tech_summit_1792071772901.jpg',
        start_at: '2026-11-12T11:00:00Z',
        end_at: '2026-11-12T15:00:00Z',
        capacity: 2, // Realistic test capacity: 2 seats, already has 2 registered users (3 & 4)
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        event_id: 6,
        organizer_id: 1,
        category_id: 2,
        venue_id: 2,
        title: 'Micro-Typography & Editorial Publication Lab',
        description: 'Exploring grid geometry, optical kerning, and expressive responsive typography for digital readers and physical academic journals.',
        image_url: '/src/assets/images/event_design_workshop_1792071774787.jpg',
        start_at: '2026-11-16T13:00:00Z',
        end_at: '2026-11-16T16:00:00Z',
        capacity: 25,
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        event_id: 7,
        organizer_id: 1,
        category_id: 3,
        venue_id: 3,
        title: 'Global Rhythms: World Music & Percussion Guild',
        description: 'Percussion ensembles exploring polyrhythms, Latin Afro-Cuban beats, and Indian classical tabla interactions.',
        image_url: '/src/assets/images/event_music_acoustic_1792071774416.jpg',
        start_at: '2026-11-20T19:00:00Z',
        end_at: '2026-11-20T21:30:00Z',
        capacity: 100,
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
      {
        event_id: 8,
        organizer_id: 1,
        category_id: 4,
        venue_id: 4,
        title: 'Navigating Early Career Engineering Roles',
        description: 'Senior alumni software engineers from leading infrastructure and cloud firms share resume review tips, system design interview strategies, and salary negotiation insights.',
        image_url: '/src/assets/images/hero_event_crowd_1792071772839.jpg',
        start_at: '2026-11-25T16:00:00Z',
        end_at: '2026-11-25T18:30:00Z',
        capacity: 40,
        status: 'published',
        created_at: '2026-10-15T08:00:00Z',
        updated_at: '2026-10-15T08:00:00Z',
      },
    ];
    this.nextEventId = 9;

    // 5. Seed Registrations
    this.registrations = [
      {
        registration_id: 1,
        user_id: 2, // Maya Rao
        event_id: 1,
        status: 'registered',
        registered_at: '2026-10-16T09:15:00Z',
        cancelled_at: null,
      },
      {
        registration_id: 2,
        user_id: 2, // Maya Rao
        event_id: 2,
        status: 'registered',
        registered_at: '2026-10-16T09:20:00Z',
        cancelled_at: null,
      },
      {
        registration_id: 3,
        user_id: 3, // Liam Chen
        event_id: 1,
        status: 'registered',
        registered_at: '2026-10-16T11:45:00Z',
        cancelled_at: null,
      },
      {
        registration_id: 4,
        user_id: 3, // Liam Chen
        event_id: 5,
        status: 'registered',
        registered_at: '2026-10-16T12:00:00Z',
        cancelled_at: null,
      },
      {
        registration_id: 5,
        user_id: 4, // Sofia Rodriguez
        event_id: 5,
        status: 'registered',
        registered_at: '2026-10-16T12:15:00Z',
        cancelled_at: null,
      },
      {
        registration_id: 6,
        user_id: 4, // Sofia Rodriguez
        event_id: 3,
        status: 'registered',
        registered_at: '2026-10-16T13:30:00Z',
        cancelled_at: null,
      },
      {
        registration_id: 7,
        user_id: 5, // Marcus Vance
        event_id: 4,
        status: 'registered',
        registered_at: '2026-10-16T14:10:00Z',
        cancelled_at: null,
      },
      {
        registration_id: 8,
        user_id: 2, // Maya Rao
        event_id: 4,
        status: 'cancelled',
        registered_at: '2026-10-16T10:00:00Z',
        cancelled_at: '2026-10-16T15:30:00Z',
      },
    ];
    this.nextRegId = 9;

    // 6. Seed Audit Logs
    this.auditLogs = [
      {
        log_id: 1,
        entity_name: 'events',
        entity_id: 1,
        action: 'STATUS_CHANGE',
        previous_state: { status: 'draft', title: 'Advancing Machine Learning in Real-Time Systems' },
        new_state: { status: 'published', title: 'Advancing Machine Learning in Real-Time Systems' },
        performed_by: 1,
        created_at: '2026-10-15T08:00:00Z',
      },
      {
        log_id: 2,
        entity_name: 'events',
        entity_id: 5,
        action: 'STATUS_CHANGE',
        previous_state: { status: 'draft', title: 'Autonomous Robotics & Vision Systems Expo' },
        new_state: { status: 'published', title: 'Autonomous Robotics & Vision Systems Expo' },
        performed_by: 1,
        created_at: '2026-10-15T08:30:00Z',
      },
    ];
    this.nextLogId = 3;
  }

  // ==========================================================================
  // VIEW 1: v_event_registration_summary
  // ==========================================================================
  getEventSummary(eventId?: number) {
    const list = eventId ? this.events.filter(e => e.event_id === eventId) : this.events;
    return list.map(e => {
      const category = this.categories.find(c => c.category_id === e.category_id);
      const venue = this.venues.find(v => v.venue_id === e.venue_id);
      const organizer = this.users.find(u => u.user_id === e.organizer_id);
      const activeRegs = this.registrations.filter(r => r.event_id === e.event_id && r.status === 'registered');
      const cancelledRegs = this.registrations.filter(r => r.event_id === e.event_id && r.status === 'cancelled');
      const activeCount = activeRegs.length;
      const remainingCapacity = Math.max(0, e.capacity - activeCount);
      const occupancyRate = e.capacity > 0 ? Math.round((activeCount * 1000) / e.capacity) / 10 : 0;
      const isFull = activeCount >= e.capacity;

      return {
        event_id: e.event_id,
        title: e.title,
        description: e.description,
        image_url: e.image_url,
        status: e.status,
        start_at: e.start_at,
        end_at: e.end_at,
        capacity: e.capacity,
        max_capacity: e.capacity,
        category_id: e.category_id,
        category_name: category?.name || 'General',
        category_slug: category?.slug || 'general',
        venue_id: e.venue_id,
        venue_name: venue?.name || 'TBD',
        venue_address: venue?.address || '',
        venue_city: venue?.city || '',
        venue_capacity: venue?.capacity || 0,
        organizer_id: e.organizer_id,
        organizer_name: organizer?.full_name || 'Admin',
        organizer_email: organizer?.email || '',
        active_registrations: activeCount,
        cancelled_registrations: cancelledRegs.length,
        remaining_capacity: remainingCapacity,
        occupancy_rate_pct: occupancyRate,
        is_full: isFull,
        created_at: e.created_at,
        updated_at: e.updated_at,
      };
    });
  }

  // ==========================================================================
  // VIEW 2: v_user_registration_history
  // ==========================================================================
  getUserRegistrationHistory(userId: number) {
    const userRegs = this.registrations.filter(r => r.user_id === userId);
    return userRegs.map(r => {
      const e = this.events.find(ev => ev.event_id === r.event_id);
      const category = e ? this.categories.find(c => c.category_id === e.category_id) : null;
      const venue = e ? this.venues.find(v => v.venue_id === e.venue_id) : null;
      const now = new Date().toISOString();
      let computedState: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

      if (r.status === 'cancelled') {
        computedState = 'cancelled';
      } else if (e && e.start_at <= now) {
        computedState = 'completed';
      }

      return {
        registration_id: r.registration_id,
        user_id: r.user_id,
        event_id: r.event_id,
        event_title: e?.title || 'Unknown Event',
        event_description: e?.description || '',
        image_url: e?.image_url || '',
        event_start_at: e?.start_at || '',
        event_end_at: e?.end_at || '',
        event_status: e?.status || 'draft',
        category_name: category?.name || 'General',
        venue_name: venue?.name || 'TBD',
        venue_address: venue?.address || '',
        registration_status: r.status,
        registered_at: r.registered_at,
        cancelled_at: r.cancelled_at,
        computed_attendance_state: computedState,
      };
    }).sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
  }

  // ==========================================================================
  // STORED PROCEDURE: sp_register_for_event
  // Demonstrates:
  // - Transaction isolation & serialization via event row-locking simulation
  // - Event published check
  // - Event date validity check
  // - Duplicate active check
  // - Capacity constraint check
  // - Reactivation of cancelled record or atomic insert
  // ==========================================================================
  async executeSpRegisterForEvent(userId: number, eventId: number): Promise<{
    success: boolean;
    result_code: string;
    message: string;
    registration?: Registration;
  }> {
    // Acquire pessimistic lock on event_id to simulate `SELECT ... FOR UPDATE`
    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>(resolve => {
      releaseLock = resolve;
    });

    const previousLock = this.eventLocks.get(eventId) || Promise.resolve();
    this.eventLocks.set(eventId, lockPromise);
    await previousLock;

    try {
      // 1. Fetch Event with lock
      const ev = this.events.find(e => e.event_id === eventId);
      if (!ev) {
        return { success: false, result_code: 'NOT_FOUND', message: 'Event not found.' };
      }

      // 2. Validate Event Status
      if (ev.status !== 'published') {
        return {
          success: false,
          result_code: 'EVENT_NOT_PUBLISHED',
          message: `Cannot register for an event with status: ${ev.status}`,
        };
      }

      // 3. Validate Event Date
      const now = new Date();
      if (new Date(ev.start_at) <= now) {
        return {
          success: false,
          result_code: 'EVENT_ALREADY_STARTED',
          message: 'Event has already started or concluded.',
        };
      }

      // 4. Duplicate Check
      const existing = this.registrations.find(
        r => r.user_id === userId && r.event_id === eventId
      );
      if (existing && existing.status === 'registered') {
        return {
          success: false,
          result_code: 'ALREADY_REGISTERED',
          message: 'You already hold an active registration for this event.',
        };
      }

      // 5. Capacity Check (Count active registrations)
      const activeCount = this.registrations.filter(
        r => r.event_id === eventId && r.status === 'registered'
      ).length;

      if (activeCount >= ev.capacity) {
        return {
          success: false,
          result_code: 'EVENT_FULL',
          message: `This event has reached full capacity (${ev.capacity} seats).`,
        };
      }

      // 6. Insert or Reactivate Registration
      let targetReg: Registration;
      const nowIso = new Date().toISOString();

      if (existing) {
        existing.status = 'registered';
        existing.registered_at = nowIso;
        existing.cancelled_at = null;
        targetReg = existing;
      } else {
        targetReg = {
          registration_id: this.nextRegId++,
          user_id: userId,
          event_id: eventId,
          status: 'registered',
          registered_at: nowIso,
          cancelled_at: null,
        };
        this.registrations.push(targetReg);
      }

      return {
        success: true,
        result_code: 'SUCCESS',
        message: 'Successfully registered for event.',
        registration: targetReg,
      };
    } finally {
      releaseLock();
    }
  }

  // ==========================================================================
  // Cancellation with status and timestamp preservation
  // ==========================================================================
  cancelRegistration(userId: number, eventId: number): boolean {
    const reg = this.registrations.find(
      r => r.user_id === userId && r.event_id === eventId && r.status === 'registered'
    );
    if (!reg) return false;

    reg.status = 'cancelled';
    reg.cancelled_at = new Date().toISOString();
    return true;
  }

  // ==========================================================================
  // TRIGGER: trg_event_status_audit
  // Automatically records audit log whenever an event status updates
  // ==========================================================================
  updateEventStatus(
    eventId: number,
    newStatus: EventStatus,
    performedByUserId: number
  ): EventRecord | null {
    const ev = this.events.find(e => e.event_id === eventId);
    if (!ev) return null;

    if (ev.status !== newStatus) {
      const oldState = { status: ev.status, title: ev.title, capacity: ev.capacity };
      ev.status = newStatus;
      ev.updated_at = new Date().toISOString();
      const newState = { status: ev.status, title: ev.title, capacity: ev.capacity };

      // Trigger firing simulation
      const logEntry: AuditLog = {
        log_id: this.nextLogId++,
        entity_name: 'events',
        entity_id: eventId,
        action: 'STATUS_CHANGE',
        previous_state: oldState,
        new_state: newState,
        performed_by: performedByUserId,
        created_at: new Date().toISOString(),
      };
      this.auditLogs.unshift(logEntry);
    }

    return ev;
  }

  // Category CRUD with referential integrity check
  deleteCategory(categoryId: number): { success: boolean; error?: string } {
    const referenced = this.events.some(e => e.category_id === categoryId);
    if (referenced) {
      return {
        success: false,
        error: 'Cannot delete category: Referenced by existing events (ON DELETE RESTRICT).',
      };
    }
    const idx = this.categories.findIndex(c => c.category_id === categoryId);
    if (idx === -1) return { success: false, error: 'Category not found.' };
    this.categories.splice(idx, 1);
    return { success: true };
  }
}

export const db = new GatherlyDatabase();
