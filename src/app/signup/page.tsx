'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function SignUpPage() {
  const router = useRouter();
  const { session, loading, initialize, signUp } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && session) {
      router.replace('/onboarding');
    }
  }, [loading, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await signUp(email, password, fullName);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setSubmitting(false);
    }
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
          <img src="/approcure-logo.png" alt="Approcure" className="w-12 h-12 rounded-lg mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-text tracking-tight">Create Account</h1>
          <p className="text-[12px] text-text-muted mt-1">Join your team on Approcure</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="px-4 py-3 bg-success-soft border border-success/20 rounded-lg">
              <p className="text-[13px] text-success font-medium">Check your email</p>
              <p className="text-[12px] text-text-muted mt-1">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="text-[12px] text-primary font-medium hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-text mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] text-text bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                  placeholder="John Smith"
                />
              </div>

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
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-[12px] text-text-muted text-center mt-4">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
