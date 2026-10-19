/**
 * Offline Emergency Handover Queue & Connectivity Handler
 * Handles offline storage of emergency handover packets and auto-sync on reconnection.
 */

export type ConnectionState = 'ONLINE' | 'WEAK_CONNECTION' | 'OFFLINE';

export interface QueuedEmergencyPacket {
  id: string;
  healthId: string;
  facilityId: string;
  facilityName: string;
  summary: {
    chiefComplaint: string;
    triageCategory: string;
    vitals: {
      consciousness: string;
      breathing: string;
      bleeding: string;
    };
    timestamp: string;
    existingConditions?: string[];
    allergies?: string[];
  };
  queuedAt: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

const STORAGE_KEY = 'aarognex_emergency_offline_queue';
const OVERRIDE_KEY = 'aarognex_network_override';

export class OfflineQueueService {
  private static instance: OfflineQueueService;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  getConnectionState(): ConnectionState {
    if (typeof window === 'undefined') return 'ONLINE';
    
    // Check manual override for testing/demo purposes
    const override = localStorage.getItem(OVERRIDE_KEY) as ConnectionState | null;
    if (override && ['ONLINE', 'WEAK_CONNECTION', 'OFFLINE'].includes(override)) {
      return override;
    }

    if (!navigator.onLine) return 'OFFLINE';
    
    // Check network speed hints if available
    const nav = navigator as any;
    if (nav.connection) {
      const effectiveType = nav.connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'WEAK_CONNECTION';
      }
    }

    return 'ONLINE';
  }

  setConnectionOverride(state: ConnectionState | null) {
    if (typeof window === 'undefined') return;
    if (!state) {
      localStorage.removeItem(OVERRIDE_KEY);
    } else {
      localStorage.setItem(OVERRIDE_KEY, state);
    }
    window.dispatchEvent(new Event('aarognex_network_changed'));
    if (state === 'ONLINE') {
      this.syncQueuedPackets();
    }
  }

  getQueue(): QueuedEmergencyPacket[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  enqueue(packet: Omit<QueuedEmergencyPacket, 'id' | 'queuedAt' | 'syncStatus' | 'retryCount'>): QueuedEmergencyPacket {
    const queue = this.getQueue();
    const newPacket: QueuedEmergencyPacket = {
      ...packet,
      id: `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queuedAt: Date.now(),
      syncStatus: 'PENDING',
      retryCount: 0
    };
    queue.push(newPacket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event('aarognex_queue_updated'));
    return newPacket;
  }

  async syncQueuedPackets(): Promise<{ synced: number; failed: number }> {
    if (typeof window === 'undefined') return { synced: 0, failed: 0 };
    const state = this.getConnectionState();
    if (state === 'OFFLINE') return { synced: 0, failed: 0 };

    const queue = this.getQueue();
    const pending = queue.filter(p => p.syncStatus === 'PENDING');
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    for (const packet of pending) {
      try {
        // Simulating packet transmission to server action
        await new Promise(resolve => setTimeout(resolve, state === 'WEAK_CONNECTION' ? 1200 : 300));
        packet.syncStatus = 'SYNCED';
        syncedCount++;
      } catch (e) {
        packet.retryCount++;
        if (packet.retryCount >= 3) packet.syncStatus = 'FAILED';
        failedCount++;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event('aarognex_queue_updated'));
    return { synced: syncedCount, failed: failedCount };
  }

  clearSynced(): void {
    if (typeof window === 'undefined') return;
    const queue = this.getQueue().filter(p => p.syncStatus !== 'SYNCED');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event('aarognex_queue_updated'));
  }

  private handleNetworkChange() {
    window.dispatchEvent(new Event('aarognex_network_changed'));
    if (this.getConnectionState() === 'ONLINE') {
      this.syncQueuedPackets();
    }
  }
}

export const offlineQueue = OfflineQueueService.getInstance();
