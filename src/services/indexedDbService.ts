import Dexie, { type Table } from 'dexie';
import { Sale, OfflineSyncItem, OfflineSyncEntityType } from '../types';

export interface PendingTransaction {
  id: string; // unique transaction key or sale.id
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  grandTotal: number;
  paidAmount: number;
  paymentMethod: string;
  branchId?: string;
  branchName?: string;
  warehouseLocation: string;
  itemsCount: number;
  saleData: Sale;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: string;
  syncedAt?: string;
}

export class OffnotOfflineDatabase extends Dexie {
  pendingTransactions!: Table<PendingTransaction, string>;
  offlineQueue!: Table<OfflineSyncItem, string>;

  constructor() {
    super('OffnotEnergy_OfflineDB_v1');
    this.version(1).stores({
      pendingTransactions: '&id, invoiceNumber, customerId, status, createdAt',
      offlineQueue: '&id, entityType, action, timestamp',
    });
  }
}

export const offlineDb = new OffnotOfflineDatabase();

/**
 * Helper services for IndexedDB pending transactions & offline queue
 */
export const IndexedDbService = {
  /**
   * Save a pending POS sale to IndexedDB
   */
  async recordPendingTransaction(sale: Sale): Promise<PendingTransaction> {
    const transaction: PendingTransaction = {
      id: sale.id || `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      invoiceNumber: sale.invoiceNumber,
      customerId: sale.customerId,
      customerName: sale.customerName,
      grandTotal: sale.grandTotal,
      paidAmount: sale.paidAmount,
      paymentMethod: sale.paymentMethod,
      branchId: sale.branchId,
      branchName: sale.branchName,
      warehouseLocation: sale.warehouseLocation,
      itemsCount: sale.items?.length || 0,
      saleData: sale,
      status: 'pending',
      retryCount: 0,
      createdAt: sale.createdAt || new Date().toISOString(),
    };

    await offlineDb.pendingTransactions.put(transaction);

    // Also queue into offline sync items table
    await offlineDb.offlineQueue.put({
      id: `sync_${transaction.id}`,
      entityType: 'sale',
      action: 'create',
      data: sale,
      timestamp: transaction.createdAt,
      retryCount: 0,
    });

    return transaction;
  },

  /**
   * Get all pending transactions from IndexedDB
   */
  async getPendingTransactions(): Promise<PendingTransaction[]> {
    try {
      return await offlineDb.pendingTransactions.where('status').equals('pending').toArray();
    } catch (e) {
      console.warn('IndexedDB getPendingTransactions error:', e);
      return [];
    }
  },

  /**
   * Mark a transaction as synced and clean up
   */
  async markTransactionSynced(transactionId: string): Promise<void> {
    try {
      await offlineDb.pendingTransactions.update(transactionId, {
        status: 'synced',
        syncedAt: new Date().toISOString(),
      });
      await offlineDb.offlineQueue.delete(`sync_${transactionId}`);
    } catch (e) {
      console.warn('IndexedDB markTransactionSynced error:', e);
    }
  },

  /**
   * Mark transaction as failed with error details
   */
  async markTransactionFailed(transactionId: string, error: string): Promise<void> {
    try {
      const item = await offlineDb.pendingTransactions.get(transactionId);
      if (item) {
        await offlineDb.pendingTransactions.update(transactionId, {
          status: 'failed',
          retryCount: (item.retryCount || 0) + 1,
          lastError: error,
        });
      }
    } catch (e) {
      console.warn('IndexedDB markTransactionFailed error:', e);
    }
  },

  /**
   * Enqueue generic offline sync item in IndexedDB
   */
  async enqueueOfflineItem(
    entityType: OfflineSyncEntityType,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<OfflineSyncItem> {
    const item: OfflineSyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    try {
      await offlineDb.offlineQueue.put(item);
    } catch (e) {
      console.warn('IndexedDB enqueue error:', e);
    }
    return item;
  },

  /**
   * Get all items currently queued in IndexedDB
   */
  async getAllQueuedItems(): Promise<OfflineSyncItem[]> {
    try {
      return await offlineDb.offlineQueue.toArray();
    } catch (e) {
      console.warn('IndexedDB getAllQueuedItems error:', e);
      return [];
    }
  },

  /**
   * Remove item from IndexedDB queue
   */
  async dequeueItem(itemId: string): Promise<void> {
    try {
      await offlineDb.offlineQueue.delete(itemId);
    } catch (e) {
      console.warn('IndexedDB dequeueItem error:', e);
    }
  },

  /**
   * Get total count of pending offline records across IndexedDB
   */
  async getPendingCount(): Promise<number> {
    try {
      return await offlineDb.offlineQueue.count();
    } catch (e) {
      return 0;
    }
  },

  /**
   * Clear all synced or complete queues
   */
  async clearAll(): Promise<void> {
    try {
      await offlineDb.pendingTransactions.clear();
      await offlineDb.offlineQueue.clear();
    } catch (e) {
      console.warn('IndexedDB clear error:', e);
    }
  },
};
