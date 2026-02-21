'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/data/store';
import { UserRole } from '@/data/types';
import { USERS } from '@/data/seed';

const ROLE_OPTIONS: { role: UserRole; label: string; desc: string; userId: string }[] = [
  { role: 'manager', label: 'Project Manager', desc: 'Sarah Chen – Approve up to $5,000', userId: 'u3' },
  { role: 'worker', label: 'Field Worker', desc: 'Mike Torres – Submit purchase requests', userId: 'u1' },
  { role: 'admin', label: 'Admin', desc: 'Tom Bradley – Approve up to $25,000', userId: 'u4' },
];

export default function LoginPage() {
  const router = useRouter();
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [selected, setSelected] = useState<string>('u3');

  const handleLogin = () => {
    const user = USERS.find((u) => u.id === selected);
    if (user) {
      setCurrentUser(user);
      router.push('/queue');
    }
  };

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

        {/* Role selection */}
        <div className="space-y-2 mb-6">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.userId}
              onClick={() => setSelected(opt.userId)}
              className={`w-full text-left px-4 py-3.5 rounded-lg border transition-colors ${
                selected === opt.userId
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-white hover:border-text-muted/40'
              }`}
            >
              <p className={`text-[13px] font-semibold ${selected === opt.userId ? 'text-primary' : 'text-text'}`}>
                {opt.label}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-hover transition-colors"
        >
          Sign In as Demo User
        </button>

        <p className="text-[11px] text-text-muted text-center mt-4">
          Demo mode — all data is local and resets on reload.
        </p>
      </div>
    </div>
  );
}
