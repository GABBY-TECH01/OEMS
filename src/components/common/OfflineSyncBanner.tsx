import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, offlineQueueCount, isSyncingOfflineQueue, flushOfflineSyncQueue, pendingTransactions } = useApp();

  // If online and nothing is queued for sync, don't show intrusive banner
  if (isOnline && offlineQueueCount === 0) {
    return null;
  }

  const posCount = pendingTransactions.length;

  return (
    <div className={`w-full px-4 py-2 text-xs flex items-center justify-between transition-colors ${
      !isOnline
        ? 'bg-amber-600 text-white shadow-inner'
        : 'bg-emerald-800 text-emerald-50 dark:bg-emerald-950 dark:text-emerald-200 border-b border-emerald-700/50'
    }`}>
      <div className="flex items-center gap-2 max-w-xl">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
            <span className="font-semibold">
              Offline Mode Active:
            </span>
            <span className="opacity-95 text-[11px] sm:text-xs">
              {posCount > 0 ? (
                <>
                  <Database className="w-3 h-3 inline mx-1 text-amber-200" />
                  <strong>{posCount} POS {posCount === 1 ? 'sale' : 'sales'}</strong> saved to IndexedDB. Everything works offline and will auto-sync on reconnect.
                </>
              ) : (
                'All sales, expenses, and records are safely saved locally to IndexedDB and will auto-sync when you reconnect.'
              )}
            </span>
          </>
        ) : (
          <>
            <CloudUpload className="w-4 h-4 shrink-0 text-emerald-300" />
            <span className="font-semibold">
              Online Reconnected:
            </span>
            <span className="opacity-95 text-[11px] sm:text-xs">
              {offlineQueueCount} offline {offlineQueueCount === 1 ? 'record' : 'records'} stored in IndexedDB pending cloud sync.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {offlineQueueCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold tracking-wider uppercase">
            {offlineQueueCount} queued
          </span>
        )}

        {isOnline && offlineQueueCount > 0 && (
          <button
            onClick={() => flushOfflineSyncQueue()}
            disabled={isSyncingOfflineQueue}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white text-emerald-900 rounded-lg hover:bg-emerald-50 active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingOfflineQueue ? 'animate-spin' : ''}`} />
            <span>{isSyncingOfflineQueue ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
