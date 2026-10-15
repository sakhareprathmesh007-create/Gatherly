import React, { useState } from 'react';
import { User } from '../types.ts';
import { api, saveAuthSession } from '../lib/api.ts';
import { X, ShieldCheck, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        saveAuthSession(res.token, res.user);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.register({ fullName, email, password });
        saveAuthSession(res.token, res.user);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: demoEmail, password: 'DemoAdmin123!' });
      saveAuthSession(res.token, res.user);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-left">
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign In to Gatherly' : 'Create Attendee Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Access event reservations and attendee dashboards.'
              : 'Join the campus community and book seats for upcoming events.'}
          </p>
        </div>

        {/* Quick Demo Credentials Bar for Evaluators */}
        <div className="mb-6 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Quick Demo Sign-In (Viva / Evaluation)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@gatherly.local')}
              disabled={loading}
              className="py-1.5 px-2 bg-white hover:bg-indigo-100/60 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('maya.rao@example.test')}
              disabled={loading}
              className="py-1.5 px-2 bg-white hover:bg-indigo-100/60 text-indigo-950 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Attendee Demo</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Maya Rao"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. attendee@campus.edu"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-slate-600">
          {mode === 'login' ? (
            <p>
              New to Gatherly?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Sign in instead
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
