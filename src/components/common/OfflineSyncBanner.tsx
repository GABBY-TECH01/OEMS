import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, offlineQueueCount, isSyncingOfflineQueue } = useApp();
  const [justSynced, setJustSynced] = useState(false);
  const prevCountRef = useRef(offlineQueueCount);

  // Detect when queued items have been successfully synced to 0
  useEffect(() => {
    if (prevCountRef.current > 0 && offlineQueueCount === 0 && isOnline) {
      setJustSynced(true);
      const timer = setTimeout(() => {
        setJustSynced(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = offlineQueueCount;
  }, [offlineQueueCount, isOnline]);

  // When online and nothing is queued or syncing, completely disappear
  if (isOnline && offlineQueueCount === 0 && !isSyncingOfflineQueue && !justSynced) {
    return null;
  }

  return (
    <aside aria-label="Network Status" className="fixed top-16 right-3 sm:right-6 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* 1. Offline with items queued */}
      {!isOnline && offlineQueueCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/90 text-amber-200 border border-amber-500/50 shadow-lg backdrop-blur-md text-xs font-bold pointer-events-auto">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span>{offlineQueueCount} Queued Offline</span>
        </div>
      )}

      {/* 2. Offline with 0 items queued */}
      {!isOnline && offlineQueueCount === 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700 shadow-md backdrop-blur-md text-[11px] font-medium pointer-events-auto">
          <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Offline Mode</span>
        </div>
      )}

      {/* 3. Online & currently auto-syncing in background */}
      {isOnline && isSyncingOfflineQueue && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/95 text-emerald-200 border border-emerald-500/50 shadow-lg backdrop-blur-md text-xs font-bold animate-pulse pointer-events-auto">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
          <span>Syncing {offlineQueueCount > 0 ? offlineQueueCount : ''} offline sales...</span>
        </div>
      )}

      {/* 4. Sync complete confirmation (auto-dismisses after 2.5s) */}
      {isOnline && justSynced && !isSyncingOfflineQueue && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/95 text-emerald-100 border border-emerald-400/60 shadow-lg backdrop-blur-md text-xs font-bold pointer-events-auto">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Synced to Supabase</span>
        </div>
      )}
    </aside>
  );
};
