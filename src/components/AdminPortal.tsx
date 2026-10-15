import React, { useState, useEffect } from 'react';
import { User, EventSummary, Category, Venue, AuditLogItem, AdminOverviewData } from '../types.ts';
import { api } from '../lib/api.ts';
import {
  Calendar,
  Users,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  Activity,
  Zap,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User;
  onOpenEventDetail: (eventId: number) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, onOpenEventDetail }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'categories' | 'audit' | 'concurrency'>('events');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attendees modal
  const [selectedEventAttendees, setSelectedEventAttendees] = useState<{
    event: EventSummary;
    attendees: any[];
  } | null>(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Create/Edit Event Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventSummary | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    categoryId: 1,
    venueId: 1,
    startAt: '',
    endAt: '',
    capacity: 50,
    status: 'published' as 'draft' | 'published' | 'cancelled' | 'archived',
    imageUrl: '',
  });

  // Create Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Concurrency test state
  const [concurrencyResult, setConcurrencyResult] = useState<any | null>(null);
  const [testingConcurrency, setTestingConcurrency] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, evData, catData, venData, logsData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminEvents(),
        api.getCategories(),
        api.getVenues(),
        api.getAdminAuditLogs(),
      ]);
      setOverview(ovData);
      setEvents(evData);
      setCategories(catData);
      setVenues(venData);
      setAuditLogs(logsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    const now = new Date();
    const defaultStart = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const defaultEnd = new Date(defaultStart.getTime() + 3 * 3600 * 1000);

    setEventFormData({
      title: '',
      description: '',
      categoryId: categories[0]?.category_id || 1,
      venueId: venues[0]?.venue_id || 1,
      startAt: defaultStart.toISOString().slice(0, 16),
      endAt: defaultEnd.toISOString().slice(0, 16),
      capacity: 50,
      status: 'published',
      imageUrl: '/src/assets/images/hero_event_crowd_1792071772839.jpg',
    });
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (ev: EventSummary) => {
    setEditingEvent(ev);
    setEventFormData({
      title: ev.title,
      description: ev.description,
      categoryId: ev.category_id,
      venueId: ev.venue_id,
      startAt: new Date(ev.start_at).toISOString().slice(0, 16),
      endAt: new Date(ev.end_at).toISOString().slice(0, 16),
      capacity: ev.capacity,
      status: ev.status,
      imageUrl: ev.image_url,
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: eventFormData.title,
        description: eventFormData.description,
        categoryId: Number(eventFormData.categoryId),
        venueId: Number(eventFormData.venueId),
        startAt: new Date(eventFormData.startAt).toISOString(),
        endAt: new Date(eventFormData.endAt).toISOString(),
        capacity: Number(eventFormData.capacity),
        status: eventFormData.status,
        imageUrl: eventFormData.imageUrl,
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.event_id, payload);
      } else {
        await api.createEvent(payload);
      }

      setShowEventModal(false);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to save event.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId: number, newStatus: any) => {
    try {
      await api.updateEvent(eventId, { status: newStatus });
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleViewAttendees = async (ev: EventSummary) => {
    setLoadingAttendees(true);
    setSelectedEventAttendees({ event: ev, attendees: [] });
    try {
      const attendees = await api.getEventAttendees(ev.event_id);
      setSelectedEventAttendees({ event: ev, attendees });
    } catch (err: any) {
      alert(err.message || 'Failed to load attendees');
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      setNewCatName('');
      setNewCatDesc('');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm('Are you sure you want to delete this category? (Foreign keys will restrict if referenced)')) return;
    try {
      await api.deleteCategory(catId);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleRunConcurrencyTest = async () => {
    setTestingConcurrency(true);
    try {
      const res = await api.runConcurrencyTest();
      setConcurrencyResult(res);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Test failed');
    } finally {
      setTestingConcurrency(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              DBMS Administrator Console
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
              Role: Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative CRUD, capacity management, trigger audit verification, and transactional concurrency controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-stone-100 rounded-lg transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreateEvent}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Published Events</p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {overview.metrics.published_events_count}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Active Seats</p>
            <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
              {overview.metrics.total_active_registrations}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">At Capacity</p>
            <p className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1">
              {overview.metrics.events_at_capacity_count}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Categories</p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {overview.metrics.categories_count}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Venues</p>
            <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {overview.metrics.venues_count}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Registered Users</p>
            <p className="text-xl font-bold font-mono tabular-nums text-indigo-600 mt-1">
              {overview.metrics.total_registered_users}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-stone-200 flex items-center gap-6 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 border-b-2 -mb-px whitespace-nowrap transition-colors ${
            activeTab === 'events'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Event Management ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 border-b-2 -mb-px whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 -mb-px whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Trigger Audit Log ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('concurrency')}
          className={`pb-3 border-b-2 -mb-px whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'concurrency'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Concurrency Stress Test</span>
        </button>
      </div>

      {/* Tab 1: Event Management */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">ID / Title</th>
                    <th className="p-3.5">Category & Venue</th>
                    <th className="p-3.5">Date / Time</th>
                    <th className="p-3.5">Capacity & Bookings</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {events.map(ev => (
                    <tr key={ev.event_id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <span className="font-mono text-slate-400">#{ev.event_id}</span>
                        <p className="font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer" onClick={() => onOpenEventDetail(ev.event_id)}>
                          {ev.title}
                        </p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{ev.category_name}</p>
                        <p className="text-slate-500">{ev.venue_name}</p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-800">
                          {new Date(ev.start_at).toLocaleDateString()}
                        </p>
                        <p className="text-slate-500">
                          {new Date(ev.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono tabular-nums font-semibold text-slate-800">
                          {ev.active_registrations} / {ev.max_capacity}
                        </span>
                        <span className="text-slate-500 ml-1">({ev.occupancy_rate_pct}%)</span>
                        {ev.is_full && (
                          <span className="ml-2 text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                            Full
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <select
                          value={ev.status}
                          onChange={e => handleStatusChange(ev.event_id, e.target.value)}
                          className="px-2 py-1 bg-stone-100 text-slate-800 font-semibold rounded border border-stone-300 text-xs focus:outline-none"
                        >
                          <option value="published">published</option>
                          <option value="draft">draft</option>
                          <option value="cancelled">cancelled</option>
                          <option value="archived">archived</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleViewAttendees(ev)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 transition-colors"
                        >
                          Attendees ({ev.active_registrations})
                        </button>
                        <button
                          onClick={() => handleOpenEditEvent(ev)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-stone-100 rounded transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Category Management */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Category Form */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs h-fit">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Category</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enforces UNIQUE constraint on category name & slug in database.
            </p>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Science & Biotech"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Scope and description of this category..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="md:col-span-2 space-y-3">
            {categories.map(cat => (
              <div
                key={cat.category_id}
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">#{cat.category_id}</span>
                    <h4 className="font-bold text-slate-900">{cat.name}</h4>
                    <span className="text-xs text-slate-400">({cat.slug})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-lg">{cat.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">
                    {cat.event_count || 0} events
                  </span>
                  <button
                    onClick={() => handleDeleteCategory(cat.category_id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Trigger Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
            <Activity className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Automated Database Trigger: trg_event_status_audit</p>
              <p className="mt-0.5 text-indigo-800">
                Whenever an event's status is updated (e.g. from published to cancelled or archived), the MySQL engine automatically executes an AFTER UPDATE trigger and persists previous state and new state snapshots into the audit_logs table.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Log ID</th>
                    <th className="p-3.5">Entity / Target</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Previous State (JSON)</th>
                    <th className="p-3.5">New State (JSON)</th>
                    <th className="p-3.5">Trigger Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {auditLogs.map(log => (
                    <tr key={log.log_id} className="hover:bg-stone-50/50">
                      <td className="p-3.5 text-slate-500">#{log.log_id}</td>
                      <td className="p-3.5 text-slate-900 font-bold">
                        {log.entity_name} #{log.entity_id}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-2xs font-sans font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-2xs text-slate-600 max-w-xs truncate">
                        {JSON.stringify(log.previous_state)}
                      </td>
                      <td className="p-3.5 text-2xs text-emerald-700 max-w-xs truncate">
                        {JSON.stringify(log.new_state)}
                      </td>
                      <td className="p-3.5 text-slate-500 text-2xs">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Concurrency Stress Test */}
      {activeTab === 'concurrency' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Two-User Race Condition for Last Seat (ACID Isolation Demo)</span>
            </h3>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              In DBMS exam viva evaluations, examiners frequently test how the application handles two simultaneous requests competing for the exact last available seat. This stress test dispatches two concurrent registration requests (Liam Chen & Sofia Rodriguez) for a test event configured with <code>capacity = 1</code>.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
            <p className="font-semibold text-slate-900">Execution Mechanism:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Stored procedure <code>sp_register_for_event</code> initiates a transaction with <code>START TRANSACTION</code>.</li>
              <li>Pessimistic row-level lock <code>SELECT ... FOR UPDATE</code> serializes incoming transactions on the event row.</li>
              <li>First request acquires lock, checks capacity (0 booked {'<'} 1 capacity), and commits.</li>
              <li>Second request waits on lock, wakes up, detects active count is now 1 (full), rolls back, and returns <code>409 EVENT_FULL</code>!</li>
            </ul>
          </div>

          <button
            onClick={handleRunConcurrencyTest}
            disabled={testingConcurrency}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{testingConcurrency ? 'Simulating Race Condition...' : 'Fire Concurrent Requests Now'}</span>
          </button>

          {concurrencyResult && (
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{concurrencyResult.message}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <p className="font-bold text-slate-900">Request 1 ({concurrencyResult.data.request_1.user})</p>
                  <p className="text-emerald-700 mt-1">Status: {concurrencyResult.data.request_1.result_code}</p>
                  <p className="text-slate-600">{concurrencyResult.data.request_1.message}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <p className="font-bold text-slate-900">Request 2 ({concurrencyResult.data.request_2.user})</p>
                  <p className="text-amber-700 mt-1">Status: {concurrencyResult.data.request_2.result_code}</p>
                  <p className="text-slate-600">{concurrencyResult.data.request_2.message}</p>
                </div>
              </div>

              <div className="text-2xs text-slate-500 font-mono">
                Execution time: {concurrencyResult.data.duration_ms}ms · Overbooking prevented · Active Seats: {concurrencyResult.data.actual_active_registered_seats} / {concurrencyResult.data.target_capacity}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendees Modal */}
      {selectedEventAttendees && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registered Attendees</h3>
                <p className="text-xs text-slate-500">{selectedEventAttendees.event.title}</p>
              </div>
              <button
                onClick={() => setSelectedEventAttendees(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {loadingAttendees ? (
                <p className="text-xs text-slate-500 text-center py-8">Loading attendee records...</p>
              ) : selectedEventAttendees.attendees.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No registered attendees yet.</p>
              ) : (
                selectedEventAttendees.attendees.map(a => (
                  <div
                    key={a.registration_id}
                    className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{a.full_name}</p>
                      <p className="text-slate-500">{a.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-2xs font-semibold capitalize ${
                        a.status === 'registered' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {a.status}
                      </span>
                      <p className="text-2xs text-slate-400 mt-1 font-mono">
                        {new Date(a.registered_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-stone-200 text-right">
              <button
                onClick={() => setSelectedEventAttendees(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingEvent ? 'Edit Scheduled Event' : 'Create New Event'}
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventFormData.title}
                  onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })}
                  placeholder="e.g. NextGen Robotics Demonstration"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={eventFormData.description}
                  onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })}
                  placeholder="Detailed agenda, requirements, and background..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category (Foreign Key)</label>
                  <select
                    value={eventFormData.categoryId}
                    onChange={e => setEventFormData({ ...eventFormData, categoryId: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue (Foreign Key)</label>
                  <select
                    value={eventFormData.venueId}
                    onChange={e => setEventFormData({ ...eventFormData, venueId: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {venues.map(v => (
                      <option key={v.venue_id} value={v.venue_id}>
                        {v.name} (Max {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventFormData.startAt}
                    onChange={e => setEventFormData({ ...eventFormData, startAt: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventFormData.endAt}
                    onChange={e => setEventFormData({ ...eventFormData, endAt: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Capacity (Constraint {'>'} 0)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={eventFormData.capacity}
                    onChange={e => setEventFormData({ ...eventFormData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Status</label>
                  <select
                    value={eventFormData.status}
                    onChange={e => setEventFormData({ ...eventFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="published">published</option>
                    <option value="draft">draft</option>
                    <option value="cancelled">cancelled</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
