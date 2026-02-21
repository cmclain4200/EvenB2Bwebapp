'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSubmitting(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setSubmitting(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-success-soft flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text">Check Your Email</h1>
          <p className="text-[12px] text-text-muted mt-2">
            We sent a password reset link to <strong>{email}</strong>
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary-hover transition-colors mt-6"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-semibold text-lg">E</span>
          </div>
          <h1 className="text-xl font-semibold text-text tracking-tight">Reset Password</h1>
          <p className="text-[12px] text-text-muted mt-1">Enter your email to receive a reset link</p>
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
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-[12px] text-text-muted text-center mt-4">
          Remember your password?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
