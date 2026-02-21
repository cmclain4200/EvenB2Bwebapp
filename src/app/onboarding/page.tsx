'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function OnboardingPage() {
  const router = useRouter();
  const { session, loading, onboarded, initialize, claimAccessCode, signOut } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
    if (!loading && session && onboarded) {
      router.replace('/queue');
    }
  }, [loading, session, onboarded, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError('');
    setSubmitting(true);

    const result = await claimAccessCode(code.trim());
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
    // onboarded state change triggers redirect via useEffect
  };

  if (loading || (!session && !loading)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-semibold text-lg">E</span>
          </div>
          <h1 className="text-xl font-semibold text-text tracking-tight">Join Your Team</h1>
          <p className="text-[12px] text-text-muted mt-1">
            Enter the access code your admin gave you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-text mb-1">Access Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[15px] text-text bg-white text-center font-mono tracking-[0.2em] uppercase focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
              placeholder="XXXX-XXXX"
              maxLength={12}
              autoFocus
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-danger-soft border border-danger/20 rounded-lg">
              <p className="text-[12px] text-danger">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Joining...' : 'Join Organization'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-[11px] text-text-muted text-center">
            Don&apos;t have a code? Ask your project admin or manager.
          </p>
          <button
            onClick={signOut}
            className="block mx-auto mt-2 text-[12px] text-text-muted hover:text-text transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
