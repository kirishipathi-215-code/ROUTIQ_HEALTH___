'use client';

import React, { useState, useEffect } from 'react';
import { offlineQueue, ConnectionState, QueuedEmergencyPacket } from '@/lib/offlineQueue';

export default function ConnectivityStatus() {
  const [connection, setConnection] = useState<ConnectionState>('ONLINE');
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAccessPointInfo, setShowAccessPointInfo] = useState(false);

  const refreshState = () => {
    setConnection(offlineQueue.getConnectionState());
    const queue = offlineQueue.getQueue();
    setPendingCount(queue.filter(p => p.syncStatus === 'PENDING').length);
  };

  useEffect(() => {
    refreshState();
    const onNetwork = () => refreshState();
    const onQueue = () => refreshState();

    window.addEventListener('aarognex_network_changed', onNetwork);
    window.addEventListener('aarognex_queue_updated', onQueue);
    window.addEventListener('online', onNetwork);
    window.addEventListener('offline', onNetwork);

    return () => {
      window.removeEventListener('aarognex_network_changed', onNetwork);
      window.removeEventListener('aarognex_queue_updated', onQueue);
      window.removeEventListener('online', onNetwork);
      window.removeEventListener('offline', onNetwork);
    };
  }, []);

  const handleSimulateState = (state: ConnectionState | null) => {
    offlineQueue.setConnectionOverride(state);
    refreshState();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await offlineQueue.syncQueuedPackets();
    setIsSyncing(false);
    refreshState();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Network Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xs bg-white">
        <span
          className={`w-2 h-2 rounded-full ${
            connection === 'ONLINE'
              ? 'bg-emerald-500 animate-pulse'
              : connection === 'WEAK_CONNECTION'
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
        />
        <span className="font-semibold uppercase tracking-wider text-[11px] text-gray-700">
          {connection === 'ONLINE' && 'Online'}
          {connection === 'WEAK_CONNECTION' && 'Weak 2G / Slow'}
          {connection === 'OFFLINE' && 'Offline'}
        </span>

        {/* Simulation Selector */}
        <select
          value={connection}
          onChange={(e) => handleSimulateState(e.target.value as ConnectionState)}
          aria-label="Simulation Network Mode"
          className="ml-1 bg-gray-50 border border-gray-200 text-gray-600 rounded px-1 py-0.5 text-[10px] focus:outline-hidden"
          title="Simulate connection for testing emergency queuing"
        >
          <option value="ONLINE">Live: Online</option>
          <option value="WEAK_CONNECTION">Sim: Weak (2G)</option>
          <option value="OFFLINE">Sim: Offline</option>
        </select>
      </div>

      {/* Pending Packets Badge */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-[11px]">
          <span>{pendingCount} offline packet{pendingCount > 1 ? 's' : ''}</span>
          {connection !== 'OFFLINE' && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="ml-1 underline font-semibold text-amber-900 hover:text-amber-700"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      )}

      {/* AarogNex Access Point Prototype Indicator */}
      <button
        onClick={() => setShowAccessPointInfo(!showAccessPointInfo)}
        className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-medium hover:bg-blue-100 transition-colors"
        title="AarogNex Health Access Point Concept"
      >
        Access Point Node #04 (Rural Kiosk)
      </button>

      {/* Access Point Info Modal / Dropdown */}
      {showAccessPointInfo && (
        <div className="absolute top-12 right-4 z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-4 max-w-sm text-gray-700 text-xs">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-900 text-sm">AarogNex Health Access Point</h4>
            <button
              onClick={() => setShowAccessPointInfo(false)}
              className="text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
          </div>
          <p className="mb-2 text-gray-600 leading-relaxed">
            Decentralized access point prototype designed for rural/peri-urban PHCs and community kiosks with intermittent electricity and cellular coverage.
          </p>
          <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5 border border-gray-100 mb-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Node ID:</span>
              <span className="font-mono font-medium">HAP-MH-RUR-004</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Local Cache:</span>
              <span className="text-emerald-700 font-medium">Ready (Offline Queue)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Handover Protocol:</span>
              <span className="font-medium">Store-and-Forward (SMS/Data)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Queued Packets:</span>
              <span className="font-bold">{pendingCount}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 italic">
            *In production deployment, access points sync via low-bandwidth SMS/LoRa mesh when cellular networks fail.
          </p>
        </div>
      )}
    </div>
  );
}
