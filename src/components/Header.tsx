import React from 'react';
import { User } from '../types.ts';
import { Sparkles, Calendar, Database, LogOut, Menu, X, ShieldCheck, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  activeView: 'explore' | 'dashboard' | 'admin';
  onNavigate: (view: 'explore' | 'dashboard' | 'admin') => void;
  onOpenAuth: () => void;
  onOpenDbmsExplorer: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onOpenDbmsExplorer,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              G
            </span>
            <span>Gatherly</span>
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('explore')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'explore' ? 'text-indigo-600 font-semibold' : ''
              }`}
            >
              Explore Events
            </button>

            {currentUser && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'dashboard' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                My Registrations
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeView === 'admin' ? 'text-indigo-600 font-semibold' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Admin Console</span>
              </button>
            )}

            <button
              onClick={onOpenDbmsExplorer}
              className="text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              title="Inspect MySQL Schema, Views, Stored Procedures, and Triggers"
            >
              <Database className="w-4 h-4 text-slate-500" />
              <span>DBMS Architecture</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <p className="font-semibold text-slate-900 leading-tight">{currentUser.fullName}</p>
                  <p className="text-slate-500 capitalize">{currentUser.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => {
              onNavigate('explore');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
          >
            Explore Events
          </button>
          {currentUser && (
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
            >
              My Registrations
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
            >
              Admin Console
            </button>
          )}
          <button
            onClick={() => {
              onOpenDbmsExplorer();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
          >
            DBMS Architecture (Schema & SQL)
          </button>

          <div className="pt-3 border-t border-stone-200">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{currentUser.fullName}</p>
                  <p className="text-xs text-slate-500 capitalize">{currentUser.role} · {currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 font-semibold px-2 py-1 bg-rose-50 rounded"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg text-center"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
