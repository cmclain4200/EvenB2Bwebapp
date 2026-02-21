'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/queue': 'Approvals',
  '/projects': 'Budget',
  '/activity': 'Audit Trail',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Even B2B';

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-[220px] min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-border h-12 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button className="text-text-muted hover:text-text transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 className="text-[15px] font-semibold text-text">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* User Avatars */}
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-surface border-2 border-white flex items-center justify-center">
                <span className="text-[9px] font-semibold text-text-muted">SC</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-surface border-2 border-white flex items-center justify-center">
                <span className="text-[9px] font-semibold text-text-muted">SD</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-surface border-2 border-white flex items-center justify-center">
                <span className="text-[9px] font-semibold text-text-muted">TB</span>
              </div>
            </div>
            {/* Search */}
            <button className="text-text-muted hover:text-text transition-colors p-1.5 rounded-md hover:bg-surface">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            {/* Notification Bell */}
            <button className="text-text-muted hover:text-text transition-colors p-1.5 rounded-md hover:bg-surface">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            {/* More Menu */}
            <button className="text-text-muted hover:text-text transition-colors p-1.5 rounded-md hover:bg-surface">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
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
