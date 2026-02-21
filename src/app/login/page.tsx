'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { session, loading, onboarded, initialize, signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && session) {
      router.replace(onboarded ? '/queue' : '/onboarding');
    }
  }, [loading, session, onboarded, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
    // Auth state change listener in initialize() handles redirect
  };

  if (loading) {
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
          <h1 className="text-xl font-semibold text-text tracking-tight">Even B2B</h1>
          <p className="text-[12px] text-text-muted mt-1">Purchase Approvals for Construction</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-text mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] text-text bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] text-text bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
              placeholder="Min. 6 characters"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-danger-soft border border-danger/20 rounded-lg">
              <p className="text-[12px] text-danger">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-[12px] text-text-muted text-center mt-3">
          <button
            onClick={() => router.push('/forgot-password')}
            className="text-primary font-medium hover:underline"
          >
            Forgot password?
          </button>
        </p>

        <p className="text-[12px] text-text-muted text-center mt-2">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => router.push('/signup')}
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
