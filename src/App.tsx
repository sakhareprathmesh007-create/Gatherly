/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User, EventSummary, Category } from './types.ts';
import { api, getStoredUser, clearAuthSession } from './lib/api.ts';
import { Header } from './components/Header.tsx';
import { EventCard } from './components/EventCard.tsx';
import { EventDetailModal } from './components/EventDetailModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AttendeeDashboard } from './components/AttendeeDashboard.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { DbmsExplorerModal } from './components/DbmsExplorerModal.tsx';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle,
  Users,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'explore' | 'dashboard' | 'admin'>('explore');

  // Events & Filter state
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'soonest' | 'latest' | 'popular' | 'capacity'>('soonest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User registrations tracking
  const [userRegisteredEventIds, setUserRegisteredEventIds] = useState<Set<number>>(new Set());

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dbmsModalOpen, setDbmsModalOpen] = useState(false);

  // Initialize session
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Fetch registered event IDs when user changes
  const fetchUserRegistrations = async () => {
    if (!currentUser) {
      setUserRegisteredEventIds(new Set());
      return;
    }
    try {
      const history = await api.getMyRegistrations();
      const activeIds = new Set(
        history.filter(r => r.registration_status === 'registered').map(r => r.event_id)
      );
      setUserRegisteredEventIds(activeIds);
    } catch {
      // Ignore or clear if unauthenticated
    }
  };

  useEffect(() => {
    fetchUserRegistrations();
  }, [currentUser]);

  // Load public events and categories
  const loadEventsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, catsRes] = await Promise.all([
        api.getEvents({
          q: searchQuery,
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
          sort: sortOption,
        }),
        api.getCategories(),
      ]);
      setEvents(eventsRes.items);
      setCategories(catsRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventsData();
  }, [selectedCategory, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEventsData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      clearAuthSession();
      setCurrentUser(null);
      setUserRegisteredEventIds(new Set());
      if (activeView !== 'explore') {
        setActiveView('explore');
      }
    }
  };

  const handleOpenEventDetailById = async (eventId: number) => {
    try {
      const ev = await api.getEventById(eventId);
      setSelectedEvent(ev);
    } catch {
      // fallback to list lookup
      const found = events.find(e => e.event_id === eventId);
      if (found) setSelectedEvent(found);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Universal Top Bar */}
      <Header
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={view => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenDbmsExplorer={() => setDbmsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'dashboard' && currentUser ? (
          <AttendeeDashboard
            currentUser={currentUser}
            onExploreEvents={() => setActiveView('explore')}
            onOpenEventDetail={handleOpenEventDetailById}
          />
        ) : activeView === 'admin' && currentUser?.role === 'admin' ? (
          <AdminPortal
            currentUser={currentUser}
            onOpenEventDetail={handleOpenEventDetailById}
          />
        ) : (
          /* Public Discovery View */
          <div className="space-y-12">
            {/* Hero Section with High-Impact Photographic Focal Carrier */}
            <section className="relative overflow-hidden bg-slate-950 text-white border-b border-stone-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Left Column: Value Proposition & CTAs */}
                  <div className="lg:col-span-7 space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                      <span>Campus & Community Event Platform</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
                      Discover campus talks, workshops, and gatherings in one place.
                    </h1>

                    <p className="text-base text-slate-300 max-w-xl leading-relaxed">
                      Explore academic symposiums, creative labs, live acoustics, and career roundtables—engineered with transactional capacity safety and relational database integrity.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <a
                        href="#events-catalog"
                        className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-md inline-flex items-center gap-2"
                      >
                        <span>Explore Scheduled Events</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => setDbmsModalOpen(true)}
                        className="px-5 py-3 text-sm font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/20 transition-colors inline-flex items-center gap-2"
                      >
                        <Database className="w-4 h-4 text-indigo-400" />
                        <span>Inspect DBMS Architecture</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Hero Visual Asset */}
                  <div className="lg:col-span-5 relative">
                    <div className="relative aspect-16/9 lg:aspect-4/3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                      <img
                        src="/src/assets/images/hero_event_crowd_1792071772839.jpg"
                        alt="Campus event auditorium"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-left">
                        <p className="text-xs font-semibold text-indigo-300">Live Campus Schedule</p>
                        <p className="text-sm font-bold text-white">Grand Academic Hall & North Quad Venues</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4-Item Quantitative Proof Strip */}
                <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Scheduled Events</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-white mt-1">8 Active</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Distinct Venues</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-white mt-1">4 Campus Hubs</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Storage Engine</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-indigo-400 mt-1">MySQL 8 InnoDB</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Concurrency Safety</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">Zero Overbooking</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Discovery & Catalog Section */}
            <section id="events-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              {/* Filter & Search Bar */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-left">
                {/* Search & Sort Row */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search talks, topics, hosts, or venues..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
                    >
                      Search
                    </button>

                    <select
                      value={sortOption}
                      onChange={e => setSortOption(e.target.value as any)}
                      className="px-3.5 py-2.5 text-sm font-medium rounded-xl border border-stone-200 bg-stone-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="soonest">Sort: Soonest Date</option>
                      <option value="latest">Sort: Furthest Date</option>
                      <option value="popular">Sort: Most Bookings</option>
                      <option value="capacity">Sort: Largest Capacity</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSortOption('soonest');
                      }}
                      className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-stone-100 rounded-xl transition-colors"
                      title="Reset Filters"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Interactive Category Segmented Selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-slate-400 font-medium shrink-0 mr-1">Category:</span>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                    }`}
                  >
                    All Events ({events.length})
                  </button>

                  {categories.map(cat => (
                    <button
                      key={cat.category_id}
                      onClick={() => setSelectedCategory(cat.category_id.toString())}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat.category_id.toString()
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Cards Grid */}
              {loading ? (
                <div className="py-20 text-center text-sm text-slate-500">
                  Querying relational catalog from database...
                </div>
              ) : error ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-sm text-rose-800">
                  <p className="font-bold">Failed to load events</p>
                  <p className="mt-1">{error}</p>
                </div>
              ) : events.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
                  <p className="text-base font-bold text-slate-800">No matching events found</p>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search query or selecting a different category filter.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-block"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map(ev => (
                    <EventCard
                      key={ev.event_id}
                      event={ev}
                      isRegistered={userRegisteredEventIds.has(ev.event_id)}
                      onSelect={event => setSelectedEvent(event)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          currentUser={currentUser}
          isRegistered={userRegisteredEventIds.has(selectedEvent.event_id)}
          onClose={() => setSelectedEvent(null)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onRegistrationChanged={async () => {
            await fetchUserRegistrations();
            await loadEventsData();
            // Refresh modal event data
            const updated = await api.getEventById(selectedEvent.event_id);
            setSelectedEvent(updated);
          }}
        />
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={user => {
            setCurrentUser(user);
          }}
        />
      )}

      {/* DBMS Explorer Modal */}
      {dbmsModalOpen && (
        <DbmsExplorerModal onClose={() => setDbmsModalOpen(false)} />
      )}

      {/* Quiet Footer */}
      <footer className="mt-20 border-t border-stone-200 bg-white py-12 text-xs text-slate-500 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                G
              </span>
              <span>Gatherly Event Management System</span>
            </div>
            <p>DBMS Engineering Course Project · Three-Tier Architecture (React + Express + MySQL 8.x)</p>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
            <button onClick={() => setDbmsModalOpen(true)} className="hover:text-indigo-600 transition-colors">
              ER Model & Normalization
            </button>
            <button onClick={() => setDbmsModalOpen(true)} className="hover:text-indigo-600 transition-colors">
              SQL Stored Procedures & Triggers
            </button>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
