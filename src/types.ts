export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'attendee' | 'admin';
  createdAt?: string;
}

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  event_count?: number;
}

export interface Venue {
  venue_id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';

export interface EventSummary {
  event_id: number;
  title: string;
  description: string;
  image_url: string;
  status: EventStatus;
  start_at: string;
  end_at: string;
  capacity: number;
  max_capacity: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  venue_id: number;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_capacity: number;
  organizer_id: number;
  organizer_name: string;
  organizer_email: string;
  active_registrations: number;
  cancelled_registrations: number;
  remaining_capacity: number;
  occupancy_rate_pct: number;
  is_full: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistrationHistoryItem {
  registration_id: number;
  user_id: number;
  event_id: number;
  event_title: string;
  event_description: string;
  image_url: string;
  event_start_at: string;
  event_end_at: string;
  event_status: EventStatus;
  category_name: string;
  venue_name: string;
  venue_address: string;
  registration_status: 'registered' | 'cancelled';
  registered_at: string;
  cancelled_at: string | null;
  computed_attendance_state: 'upcoming' | 'completed' | 'cancelled';
}

export interface AuditLogItem {
  log_id: number;
  entity_name: string;
  entity_id: number;
  action: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  performed_by: number | null;
  created_at: string;
}

export interface AdminOverviewData {
  metrics: {
    published_events_count: number;
    total_active_registrations: number;
    events_at_capacity_count: number;
    categories_count: number;
    venues_count: number;
    total_registered_users: number;
  };
  recent_audit_logs: AuditLogItem[];
}
