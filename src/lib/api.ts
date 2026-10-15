import { User, EventSummary, Category, Venue, RegistrationHistoryItem, AdminOverviewData, AuditLogItem } from '../types.ts';

const TOKEN_KEY = 'gatherly_auth_token';
const USER_KEY = 'gatherly_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = body?.error?.message || body?.message || `Request failed (${res.status})`;
    const code = body?.error?.code || 'ERROR';
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.code = code;
    throw error;
  }

  return body.data as T;
}

export const api = {
  // Public
  getHealth: () => request<any>('/health'),
  
  getEvents: (params?: { q?: string; categoryId?: string; sort?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return request<{ items: EventSummary[]; total: number; page: number; limit: number; total_pages: number }>(
      `/events${qs ? `?${qs}` : ''}`
    );
  },

  getEventById: (id: number) => request<EventSummary>(`/events/${id}`),
  getCategories: () => request<Category[]>('/categories'),
  getVenues: () => request<Venue[]>('/venues'),

  // Auth
  register: (payload: { fullName: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<any>('/auth/logout', { method: 'POST' }),

  getMe: () => request<User>('/auth/me'),

  // Attendee Registrations
  registerForEvent: (eventId: number) =>
    request<any>(`/events/${eventId}/registrations`, { method: 'POST' }),

  cancelRegistration: (eventId: number) =>
    request<any>(`/events/${eventId}/registrations/me`, { method: 'DELETE' }),

  getMyRegistrations: () =>
    request<RegistrationHistoryItem[]>('/registrations/me'),

  // Admin
  getAdminOverview: () => request<AdminOverviewData>('/admin/overview'),
  getAdminEvents: () => request<EventSummary[]>('/admin/events'),

  createEvent: (data: any) =>
    request<any>('/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (eventId: number, data: any) =>
    request<any>(`/admin/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  archiveEvent: (eventId: number) =>
    request<any>(`/admin/events/${eventId}`, { method: 'DELETE' }),

  getEventAttendees: (eventId: number) =>
    request<any[]>(`/admin/events/${eventId}/registrations`),

  getAdminCategories: () => request<Category[]>('/admin/categories'),

  createCategory: (data: { name: string; description: string }) =>
    request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteCategory: (categoryId: number) =>
    request<any>(`/admin/categories/${categoryId}`, { method: 'DELETE' }),

  getAdminAuditLogs: () => request<AuditLogItem[]>('/admin/audit-logs'),

  runConcurrencyTest: () =>
    request<any>('/admin/concurrency-test', { method: 'POST' }),
};
