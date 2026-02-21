'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/lib/auth-store';
import { useDataStore } from '@/lib/data-store';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/queue': 'Approvals',
  '/projects': 'Budget',
  '/activity': 'Audit Trail',
  '/integrations': 'Integrations',
  '/cost-codes': 'Cost Codes',
  '/vendors': 'Vendors',
  '/roles': 'Roles',
  '/access-codes': 'Access Codes',
  '/users': 'Users',
  '/support': 'Support',
  '/needs-attention': 'Needs Attention',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, onboarded, profile, organization, initialize } = useAuthStore();
  const initData = useDataStore((s) => s.initialize);
  const dataLoading = useDataStore((s) => s.loading);
  const title = PAGE_TITLES[pathname] ?? 'Even B2B';

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize data store once auth + org are ready
  useEffect(() => {
    if (session && onboarded && organization) {
      initData();
    }
  }, [session, onboarded, organization, initData]);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.replace('/login');
      } else if (!onboarded) {
        router.replace('/onboarding');
      }
    }
  }, [loading, session, onboarded, router]);

  if (loading || !session || !onboarded || dataLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((w) => w[0]).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-[220px] min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-border h-12 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-text">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary-soft border border-border flex items-center justify-center">
              <span className="text-[9px] font-semibold text-primary">{initials}</span>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-text leading-tight">{profile?.full_name || profile?.email}</p>
            </div>
          </div>
        </header>
        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
