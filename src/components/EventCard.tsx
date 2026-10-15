import React from 'react';
import { EventSummary } from '../types.ts';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: EventSummary;
  onSelect: (event: EventSummary) => void;
  isRegistered?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, isRegistered }) => {
  const startDate = new Date(event.start_at);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <article
      onClick={() => onSelect(event)}
      className="group flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer text-left"
    >
      {/* Visual Asset Container */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <img
          src={event.image_url || '/src/assets/images/event_tech_summit_1792071772901.jpg'}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />

        {/* Minimal functional indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-semibold shadow-xs">
          {isRegistered ? (
            <span className="text-emerald-700">Seat Reserved</span>
          ) : event.is_full ? (
            <span className="text-amber-700">At Capacity</span>
          ) : (
            <span className="text-slate-700 font-mono tabular-nums">
              {event.remaining_capacity} left
            </span>
          )}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          {/* Zero-Pill Metadata Line */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <span>{event.category_name}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedTime}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
            {event.title}
          </h3>

          <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div>
          {/* Venue & Location metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{event.venue_name}, {event.venue_city}</span>
          </div>

          {/* Bottom Bar: Capacity Status & Action */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono tabular-nums">
                {event.active_registrations} / {event.max_capacity} registered
              </span>
            </div>

            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
              Details
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
