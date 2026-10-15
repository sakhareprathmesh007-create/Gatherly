import React, { useState, useEffect } from 'react';
import { User, RegistrationHistoryItem } from '../types.ts';
import { api } from '../lib/api.ts';
import { Calendar, MapPin, AlertCircle, CheckCircle, Clock, XCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface AttendeeDashboardProps {
  currentUser: User;
  onExploreEvents: () => void;
  onOpenEventDetail: (eventId: number) => void;
}

export const AttendeeDashboard: React.FC<AttendeeDashboardProps> = ({
  currentUser,
  onExploreEvents,
  onOpenEventDetail,
}) => {
  const [registrations, setRegistrations] = useState<RegistrationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (eventId: number) => {
    setCancellingId(eventId);
    try {
      await api.cancelRegistration(eventId);
      await fetchRegistrations();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration');
    } finally {
      setCancellingId(null);
    }
  };

  const activeRegistrations = registrations.filter(r => r.registration_status === 'registered');
  const cancelledRegistrations = registrations.filter(r => r.registration_status === 'cancelled');

  const displayedList =
    activeTab === 'upcoming'
      ? registrations.filter(r => r.computed_attendance_state === 'upcoming')
      : registrations;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-left">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendee Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{currentUser.fullName}</span>. Manage your campus event passes and booking history.
          </p>
        </div>

        <button
          onClick={onExploreEvents}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Find More Events</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Active Reserved Seats</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {activeRegistrations.length}
          </p>
          <p className="text-xs text-emerald-600 mt-1">Confirmed attendance pass</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Bookings Recorded</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {registrations.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Historical ledger entries in MySQL</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-stone-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Cancelled Registrations</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {cancelledRegistrations.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Preserved in registration history</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'upcoming'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upcoming Passes ({activeRegistrations.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Complete History ({registrations.length})
          </button>
        </div>

        <button
          onClick={fetchRegistrations}
          className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors"
          title="Refresh Registrations"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading registrations from database...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'upcoming' ? 'No Upcoming Reservations' : 'No Registration Records'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              You haven't reserved any upcoming events yet. Discover keynotes, workshops, and concerts scheduled on campus.
            </p>
          </div>
          <button
            onClick={onExploreEvents}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block"
          >
            Explore Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedList.map(reg => {
            const eventDate = new Date(reg.event_start_at);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const formattedTime = eventDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={reg.registration_id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-medium text-indigo-600">{reg.category_name}</span>
                    <span className="font-mono tabular-nums">
                      Booked {new Date(reg.registered_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3
                    onClick={() => onOpenEventDetail(reg.event_id)}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1 mb-1"
                  >
                    {reg.event_title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formattedDate} at {formattedTime}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{reg.venue_name} — {reg.venue_address}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    {reg.registration_status === 'registered' ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Confirmed Seat
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelled
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEventDetail(reg.event_id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      View Details
                    </button>

                    {reg.registration_status === 'registered' && reg.computed_attendance_state === 'upcoming' && (
                      <button
                        onClick={() => handleCancel(reg.event_id)}
                        disabled={cancellingId === reg.event_id}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {cancellingId === reg.event_id ? 'Cancelling...' : 'Cancel Seat'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
