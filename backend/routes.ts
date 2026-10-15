/**
 * REST API Endpoints for Gatherly
 * Strict alignment with REST API Specification and DBMS course requirements.
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, EventStatus } from './db.js';
import { signToken, requireAuth, requireAdmin, AuthenticatedRequest } from './auth.js';

export const apiRouter = Router();

// ============================================================================
// 1. PUBLIC ROUTES
// ============================================================================

// GET /api/health
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      database: 'connected (InnoDB MySQL 8.x emulation)',
      tables: {
        users: db.users.length,
        categories: db.categories.length,
        venues: db.venues.length,
        events: db.events.length,
        registrations: db.registrations.length,
        audit_logs: db.auditLogs.length,
      },
      timestamp: new Date().toISOString(),
    },
    message: 'Gatherly API and Database are operational.',
  });
});

// GET /api/categories
apiRouter.get('/categories', (_req: Request, res: Response) => {
  const categoriesWithCounts = db.categories.map(c => {
    const eventCount = db.events.filter(e => e.category_id === c.category_id && e.status === 'published').length;
    return {
      ...c,
      event_count: eventCount,
    };
  });
  res.json({
    success: true,
    data: categoriesWithCounts,
  });
});

// GET /api/venues
apiRouter.get('/venues', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.venues,
  });
});

// GET /api/events (Search, filter, sort, pagination)
apiRouter.get('/events', (req: Request, res: Response) => {
  const { q, categoryId, from, to, sort = 'soonest', page = '1', limit = '12' } = req.query;

  let items = db.getEventSummary().filter(e => e.status === 'published');

  // Search filter
  if (q && typeof q === 'string' && q.trim()) {
    const term = q.toLowerCase().trim();
    items = items.filter(
      e =>
        e.title.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term) ||
        e.venue_name.toLowerCase().includes(term) ||
        e.category_name.toLowerCase().includes(term)
    );
  }

  // Category filter
  if (categoryId && categoryId !== 'all') {
    const catIdNum = Number(categoryId);
    if (!isNaN(catIdNum)) {
      items = items.filter(e => e.category_id === catIdNum);
    }
  }

  // Date range filter
  if (from && typeof from === 'string') {
    items = items.filter(e => new Date(e.start_at) >= new Date(from));
  }
  if (to && typeof to === 'string') {
    items = items.filter(e => new Date(e.start_at) <= new Date(to));
  }

  // Whitelisted Sorting
  switch (sort) {
    case 'soonest':
      items.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
      break;
    case 'latest':
      items.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
      break;
    case 'popular':
      items.sort((a, b) => b.active_registrations - a.active_registrations);
      break;
    case 'capacity':
      items.sort((a, b) => b.capacity - a.capacity);
      break;
    default:
      items.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
  const total = items.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = items.slice(startIndex, startIndex + limitNum);

  res.json({
    success: true,
    data: {
      items: paginatedItems,
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/events/:eventId
apiRouter.get('/events/:eventId', (req: Request, res: Response) => {
  const eventId = Number(req.params.eventId);
  const summaries = db.getEventSummary(eventId);
  if (!summaries.length) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Event not found.' },
    });
    return;
  }

  res.json({
    success: true,
    data: summaries[0],
  });
});

// ============================================================================
// 2. AUTHENTICATION ROUTES
// ============================================================================

// POST /api/auth/register
const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.issues[0]?.message || 'Invalid registration data',
      },
    });
    return;
  }

  const { fullName, email, password } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check unique email constraint
  const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    res.status(409).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' },
    });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    user_id: db.users.length + 1,
    full_name: fullName.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    role: 'attendee' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  const token = signToken(newUser);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.user_id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
      },
    },
    message: 'Account created successfully.',
  });
});

// POST /api/auth/login
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email or password format.' },
    });
    return;
  }

  const { email, password } = result.data;
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' },
    });
    return;
  }

  const token = signToken(user);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    },
    message: 'Signed in successfully.',
  });
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Signed out successfully.',
  });
});

// GET /api/auth/me
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    success: true,
    data: {
      id: user.user_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

// ============================================================================
// 3. ATTENDEE REGISTRATION ROUTES
// ============================================================================

// POST /api/events/:eventId/registrations
apiRouter.post('/events/:eventId/registrations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const eventId = Number(req.params.eventId);
  const userId = req.user!.user_id;

  const result = await db.executeSpRegisterForEvent(userId, eventId);

  if (!result.success) {
    const statusCode = result.result_code === 'NOT_FOUND' ? 404 : 409;
    res.status(statusCode).json({
      success: false,
      error: {
        code: result.result_code,
        message: result.message,
      },
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: result.registration,
    message: result.message,
  });
});

// DELETE /api/events/:eventId/registrations/me (Cancel registration)
apiRouter.delete('/events/:eventId/registrations/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const eventId = Number(req.params.eventId);
  const userId = req.user!.user_id;

  const cancelled = db.cancelRegistration(userId, eventId);
  if (!cancelled) {
    res.status(404).json({
      success: false,
      error: { code: 'REGISTRATION_NOT_FOUND', message: 'No active registration found for this event.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Registration successfully cancelled.',
  });
});

// GET /api/registrations/me (Attendee registration history via View 2)
apiRouter.get('/registrations/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.user_id;
  const history = db.getUserRegistrationHistory(userId);
  res.json({
    success: true,
    data: history,
  });
});

// ============================================================================
// 4. ADMINISTRATOR ROUTES (Protected by requireAdmin)
// ============================================================================

// GET /api/admin/overview
apiRouter.get('/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const publishedEvents = db.events.filter(e => e.status === 'published');
  const activeRegistrations = db.registrations.filter(r => r.status === 'registered');
  const eventsAtCapacity = db.getEventSummary().filter(e => e.is_full && e.status === 'published');

  res.json({
    success: true,
    data: {
      metrics: {
        published_events_count: publishedEvents.length,
        total_active_registrations: activeRegistrations.length,
        events_at_capacity_count: eventsAtCapacity.length,
        categories_count: db.categories.length,
        venues_count: db.venues.length,
        total_registered_users: db.users.filter(u => u.role === 'attendee').length,
      },
      recent_audit_logs: db.auditLogs.slice(0, 10),
    },
  });
});

// GET /api/admin/events (List all events with admin stats)
apiRouter.get('/admin/events', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const summaries = db.getEventSummary();
  res.json({
    success: true,
    data: summaries,
  });
});

// POST /api/admin/events (Create Event)
const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  categoryId: z.number().int().positive(),
  venueId: z.number().int().positive(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  capacity: z.number().int().positive(),
  status: z.enum(['draft', 'published', 'cancelled', 'archived'] as const).default('published'),
  imageUrl: z.string().optional(),
});

apiRouter.post('/admin/events', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const result = createEventSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message || 'Invalid event data' },
    });
    return;
  }

  const data = result.data;
  if (new Date(data.endAt) <= new Date(data.startAt)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATES', message: 'Event end time must be after start time.' },
    });
    return;
  }

  const newId = db.events.length + 1;
  const newEvent: any = {
    event_id: newId,
    organizer_id: req.user!.user_id,
    category_id: data.categoryId,
    venue_id: data.venueId,
    title: data.title,
    description: data.description,
    image_url: data.imageUrl || '/src/assets/images/hero_event_crowd_1792071772839.jpg',
    start_at: data.startAt,
    end_at: data.endAt,
    capacity: data.capacity,
    status: data.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.events.push(newEvent);

  res.status(201).json({
    success: true,
    data: newEvent,
    message: 'Event created successfully.',
  });
});

// PATCH /api/admin/events/:eventId (Update event fields/status)
apiRouter.patch('/admin/events/:eventId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const eventId = Number(req.params.eventId);
  const ev = db.events.find(e => e.event_id === eventId);

  if (!ev) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Event not found.' },
    });
    return;
  }

  const { title, description, categoryId, venueId, startAt, endAt, capacity, status, imageUrl } = req.body;

  if (title) ev.title = title;
  if (description) ev.description = description;
  if (categoryId) ev.category_id = Number(categoryId);
  if (venueId) ev.venue_id = Number(venueId);
  if (startAt) ev.start_at = startAt;
  if (endAt) ev.end_at = endAt;
  if (capacity) ev.capacity = Number(capacity);
  if (imageUrl) ev.image_url = imageUrl;

  // Status transition triggers audit trigger
  if (status && status !== ev.status) {
    db.updateEventStatus(eventId, status as EventStatus, req.user!.user_id);
  } else {
    ev.updated_at = new Date().toISOString();
  }

  res.json({
    success: true,
    data: ev,
    message: 'Event updated successfully.',
  });
});

// DELETE /api/admin/events/:eventId (Soft-archive event)
apiRouter.delete('/api/admin/events/:eventId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const eventId = Number(req.params.eventId);
  const ev = db.events.find(e => e.event_id === eventId);
  if (!ev) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Event not found.' },
    });
    return;
  }

  db.updateEventStatus(eventId, 'archived', req.user!.user_id);

  res.json({
    success: true,
    message: 'Event archived successfully.',
  });
});

// GET /api/admin/events/:eventId/registrations (Attendee list for event)
apiRouter.get('/admin/events/:eventId/registrations', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const eventId = Number(req.params.eventId);
  const eventRegs = db.registrations.filter(r => r.event_id === eventId);

  const attendees = eventRegs.map(r => {
    const user = db.users.find(u => u.user_id === r.user_id);
    return {
      registration_id: r.registration_id,
      user_id: r.user_id,
      full_name: user?.full_name || 'Anonymous',
      email: user?.email || '',
      status: r.status,
      registered_at: r.registered_at,
      cancelled_at: r.cancelled_at,
    };
  });

  res.json({
    success: true,
    data: attendees,
  });
});

// Category Management
apiRouter.get('/admin/categories', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: db.categories });
});

apiRouter.post('/admin/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, error: { message: 'Category name is required' } });
    return;
  }

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const existing = db.categories.find(c => c.name.toLowerCase() === name.toLowerCase().trim());
  if (existing) {
    res.status(409).json({ success: false, error: { message: 'Category already exists.' } });
    return;
  }

  const newCat = {
    category_id: db.categories.length + 1,
    name: name.trim(),
    slug,
    description: description || '',
    created_at: new Date().toISOString(),
  };

  db.categories.push(newCat);
  res.status(201).json({ success: true, data: newCat, message: 'Category created.' });
});

apiRouter.delete('/admin/categories/:categoryId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const catId = Number(req.params.categoryId);
  const result = db.deleteCategory(catId);
  if (!result.success) {
    res.status(409).json({ success: false, error: { message: result.error } });
    return;
  }
  res.json({ success: true, message: 'Category deleted.' });
});

// GET /api/admin/audit-logs
apiRouter.get('/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: db.auditLogs,
  });
});

// POST /api/admin/concurrency-test (Simulate two simultaneous requests for the final seat!)
apiRouter.post('/admin/concurrency-test', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  // Setup a test event with capacity = 1
  const testEventId = 999;
  let testEvent = db.events.find(e => e.event_id === testEventId);
  if (!testEvent) {
    testEvent = {
      event_id: testEventId,
      organizer_id: 1,
      category_id: 1,
      venue_id: 2,
      title: 'High-Concurrency Last Seat Stress Test',
      description: 'Stress testing transactional isolation with row locking for capacity safety.',
      image_url: '/src/assets/images/event_tech_summit_1792071772901.jpg',
      start_at: '2026-12-01T10:00:00Z',
      end_at: '2026-12-01T12:00:00Z',
      capacity: 1, // Only 1 seat!
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.events.push(testEvent);
  } else {
    testEvent.capacity = 1;
    testEvent.status = 'published';
  }

  // Clear any existing test registrations for this event
  db.registrations = db.registrations.filter(r => r.event_id !== testEventId);

  // Fire two concurrent registration attempts simultaneously (Liam Chen user_id=3 and Sofia Rodriguez user_id=4)
  const startTime = Date.now();
  const [res1, res2] = await Promise.all([
    db.executeSpRegisterForEvent(3, testEventId),
    db.executeSpRegisterForEvent(4, testEventId),
  ]);
  const durationMs = Date.now() - startTime;

  // Count active seats taken
  const activeCount = db.registrations.filter(r => r.event_id === testEventId && r.status === 'registered').length;
  const noOverbooking = activeCount === 1;

  res.json({
    success: true,
    data: {
      event_id: testEventId,
      target_capacity: 1,
      actual_active_registered_seats: activeCount,
      isolation_verified: noOverbooking,
      duration_ms: durationMs,
      request_1: {
        user: 'Liam Chen (User #3)',
        result_code: res1.result_code,
        message: res1.message,
        succeeded: res1.success,
      },
      request_2: {
        user: 'Sofia Rodriguez (User #4)',
        result_code: res2.result_code,
        message: res2.message,
        succeeded: res2.success,
      },
    },
    message: noOverbooking
      ? 'Concurrency isolation verified! Exactly 1 seat granted, 1 race condition safely rejected with EVENT_FULL.'
      : 'Capacity violated!',
  });
});
