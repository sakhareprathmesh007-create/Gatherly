import React, { useState } from 'react';
import { EventSummary, User } from '../types.ts';
import { X, Calendar, MapPin, Users, CheckCircle, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api.ts';

interface EventDetailModalProps {
  event: EventSummary;
  currentUser: User | null;
  isRegistered: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onRegistrationChanged: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  currentUser,
  isRegistered,
  onClose,
  onOpenAuth,
  onRegistrationChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);

  const dateString = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const timeString = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} – ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  const handleRegister = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.registerForEvent(event.event_id);
      setSuccessMessage(res.message || 'Seat successfully reserved via sp_register_for_event.');
      onRegistrationChanged();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.cancelRegistration(event.event_id);
      setSuccessMessage('Your registration was cancelled. Seat has been released.');
      setShowCancelConfirm(false);
      onRegistrationChanged();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner Media */}
        <div className="relative aspect-16/9 w-full bg-stone-100 overflow-hidden shrink-0">
          <img
            src={event.image_url || '/src/assets/images/event_tech_summit_1792071772901.jpg'}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Unboxed Metadata Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
              <span className="text-indigo-600 font-semibold">{event.category_name}</span>
              <span aria-hidden="true">·</span>
              <span>{dateString}</span>
              <span aria-hidden="true">·</span>
              <span>{timeString}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Transaction Error</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-sm text-emerald-800">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Event Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">About this Event</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Venue & Organizer Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <div>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Venue & Location
              </p>
              <p className="font-medium text-slate-700">{event.venue_name}</p>
              <p className="text-slate-500">{event.venue_address}</p>
              <p className="text-slate-500">{event.venue_city}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-indigo-600" />
                Organizer & Host
              </p>
              <p className="font-medium text-slate-700">{event.organizer_name}</p>
              <p className="text-slate-500">{event.organizer_email}</p>
              <p className="text-slate-500 mt-1">Status: <span className="font-semibold capitalize text-slate-700">{event.status}</span></p>
            </div>
          </div>

          {/* Relational Capacity Breakdown */}
          <div className="p-4 border border-stone-200 rounded-xl bg-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Seat Capacity & Availability</span>
              <span className="font-mono tabular-nums text-slate-600">
                {event.active_registrations} booked / {event.remaining_capacity} available
              </span>
            </div>

            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  event.is_full ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, event.occupancy_rate_pct)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
              <span>Occupancy: {event.occupancy_rate_pct}%</span>
              <span>Total Cap: {event.max_capacity}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {!currentUser ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                Sign In to Register
              </button>
            ) : isRegistered ? (
              showCancelConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Release seat?</span>
                  <button
                    onClick={handleCancelRegistration}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                  >
                    {loading ? 'Releasing...' : 'Yes, Cancel'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Registered
                  </span>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                  >
                    Cancel Registration
                  </button>
                </div>
              )
            ) : event.is_full ? (
              <button
                disabled
                className="px-5 py-2.5 text-sm font-semibold text-slate-400 bg-stone-200 rounded-lg cursor-not-allowed"
              >
                Event at Full Capacity
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
              >
                {loading ? 'Processing via SQL...' : 'Confirm Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
