'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useDataStore, CostCode } from '@/lib/data-store';

interface CostCodePickerProps {
  value: string;
  onChange: (id: string) => void;
}

// Simple local favorites using a module-level Set (persists during session)
const favorites = new Set<string>();
const recentCodes: string[] = [];
const MAX_RECENT = 3;

function addRecent(id: string) {
  const idx = recentCodes.indexOf(id);
  if (idx !== -1) recentCodes.splice(idx, 1);
  recentCodes.unshift(id);
  if (recentCodes.length > MAX_RECENT) recentCodes.pop();
}

export function CostCodePicker({ value, onChange }: CostCodePickerProps) {
  const store = useDataStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [, forceUpdate] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = store.getCostCodeById(value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return store.costCodes.filter(
      (cc) =>
        cc.code.toLowerCase().includes(q) ||
        cc.label.toLowerCase().includes(q) ||
        cc.category.toLowerCase().includes(q)
    );
  }, [store.costCodes, search]);

  const recentItems = useMemo(() => {
    return recentCodes
      .map((id) => store.getCostCodeById(id))
      .filter((cc): cc is CostCode => cc !== undefined && cc.id !== value);
  }, [store, value, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const favoriteItems = useMemo(() => {
    return Array.from(favorites)
      .map((id) => store.getCostCodeById(id))
      .filter((cc): cc is CostCode => cc !== undefined);
  }, [store, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (cc: CostCode) => {
    addRecent(cc.id);
    onChange(cc.id);
    setOpen(false);
    setSearch('');
  };

  const toggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    forceUpdate((n) => n + 1);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white text-text text-left flex items-center justify-between hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        <span>{selected ? `${selected.code} ${selected.label}` : 'Select cost code...'}</span>
        <svg className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-20 max-h-72 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-border-light">
            <input
              type="text"
              placeholder="Search codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md bg-white text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Favorites section */}
            {!search && favoriteItems.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-white/50">
                  Favorites
                </div>
                {favoriteItems.map((cc) => (
                  <CostCodeRow key={cc.id} cc={cc} isFav onSelect={handleSelect} onToggleFav={toggleFav} isSelected={cc.id === value} />
                ))}
              </>
            )}

            {/* Recent section */}
            {!search && recentItems.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-white/50">
                  Recent
                </div>
                {recentItems.map((cc) => (
                  <CostCodeRow key={cc.id} cc={cc} isFav={favorites.has(cc.id)} onSelect={handleSelect} onToggleFav={toggleFav} isSelected={cc.id === value} />
                ))}
              </>
            )}

            {/* All codes */}
            <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-white/50">
              {search ? `Results (${filtered.length})` : 'All Codes'}
            </div>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-muted">No codes match "{search}"</div>
            ) : (
              filtered.map((cc) => (
                <CostCodeRow key={cc.id} cc={cc} isFav={favorites.has(cc.id)} onSelect={handleSelect} onToggleFav={toggleFav} isSelected={cc.id === value} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CostCodeRow({
  cc, isFav, onSelect, onToggleFav, isSelected,
}: {
  cc: CostCode; isFav: boolean; onSelect: (cc: CostCode) => void; onToggleFav: (e: React.MouseEvent, id: string) => void; isSelected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cc)}
      className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm hover:bg-primary-soft/50 transition-colors ${isSelected ? 'bg-primary-soft font-medium' : ''}`}
    >
      <span className="font-mono text-xs text-text-muted w-12 shrink-0">{cc.code}</span>
      <span className="flex-1 text-text truncate">{cc.label}</span>
      <span className="text-[10px] text-text-muted shrink-0">{cc.category}</span>
      <button
        type="button"
        onClick={(e) => onToggleFav(e, cc.id)}
        className="ml-1 shrink-0"
      >
        <svg className={`w-3.5 h-3.5 ${isFav ? 'text-warning fill-warning' : 'text-border hover:text-warning'}`} viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      </button>
    </button>
  );
}
