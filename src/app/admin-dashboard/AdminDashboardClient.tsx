'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlatformAdminMetrics } from '@/actions/admin';
import { logout } from '@/actions/auth';
import ConnectivityStatus from '@/components/ConnectivityStatus';

export default function AdminDashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await getPlatformAdminMetrics();
      if (res.success) {
        setMetrics(res.data);
      } else {
        if (res.error?.includes('Unauthorized')) {
          router.push('/login');
          return;
        }
        setError(res.error || 'Failed to retrieve administrative metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with database.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Inspecting PostgreSQL database health and security audit logs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              ⚙
            </span>
            <div>
              <h1 className="font-bold text-white leading-tight">AarogNex Core Operations</h1>
              <p className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">
                Platform Infrastructure & Security Audit Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectivityStatus />
            <span className="px-2.5 py-1 rounded bg-indigo-950 border border-indigo-700/50 text-indigo-300 text-xs font-mono">
              Superadmin
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded border border-slate-700 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Strict Clinical Isolation Alert Banner */}
        <section className="bg-slate-900 border border-indigo-900/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 uppercase tracking-wider">
                  Least-Privilege Security Boundary
                </span>
                <span className="text-xs text-emerald-400 font-mono">Enforced at Server Action Layer</span>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                Platform Administrator access is restricted strictly to operational uptime, database health,
                facility metadata, and security audit logs. <strong>Zero clinical data, patient medical history, or consultation transcripts are accessible to administrators.</strong>
              </p>
            </div>
            <button
              onClick={loadMetrics}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Refresh Ops Status
            </button>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/60 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Infrastructure Health Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Database Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {metrics?.infrastructure?.databaseStatus ?? 'ONLINE'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Latency: {metrics?.infrastructure?.dbLatencyMs ?? 0}ms • Supabase Pg
            </span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Total Facilities
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics?.infrastructure?.totalFacilities ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {metrics?.infrastructure?.availableFacilities ?? 0} Active / Available
            </span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Emergency Events
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics?.infrastructure?.totalEmergencyEvents ?? 0}
            </div>
            <span className="text-[11px] text-amber-400 mt-1 block">
              {metrics?.infrastructure?.activeEmergencySessions ?? 0} Active Sessions
            </span>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Audit Log Volume
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics?.infrastructure?.auditLogsCount ?? 0}
            </div>
            <span className="text-[11px] text-indigo-400 mt-1 block">
              Tamper-evident log entries
            </span>
          </div>
        </section>

        {/* Security Audit Trail Viewer */}
        <section className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Tamper-Evident Security Audit Logs</h3>
              <p className="text-xs text-slate-400">
                Immutable operational ledger recording all logins, lookups, and administrative actions.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Last 20 Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Actor (Role)</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Target Type</th>
                  <th className="pb-2">Target ID</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                {metrics?.recentAuditLogs && metrics.recentAuditLogs.length > 0 ? (
                  metrics.recentAuditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {log.role}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-white whitespace-nowrap">{log.action}</td>
                      <td className="py-2.5 text-slate-400">{log.recordType || '-'}</td>
                      <td className="py-2.5 text-indigo-400 truncate max-w-[120px]">{log.recordId || '-'}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 truncate max-w-[200px]">{log.details || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500 italic">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Registered Healthcare Facilities */}
        <section className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Registered Healthcare Facilities</h3>
              <p className="text-xs text-slate-400">
                Network hospitals, trauma centers, and rural health clinics.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Total: {metrics?.facilities?.length ?? 0}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {metrics?.facilities?.map((f: any) => (
              <div key={f.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-sm">{f.name}</h4>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      f.availabilityStatus === 'AVAILABLE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {f.availabilityStatus || 'AVAILABLE'}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{f.address}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                  <span>Type: <strong className="capitalize">{f.type.toLowerCase()}</strong></span>
                  <span>Trauma: <strong>{f.traumaCare ? 'Yes' : 'No'}</strong></span>
                  <span>ICU: <strong>{f.icu ? 'Yes' : 'No'}</strong></span>
                  <span>Emergency: <strong>{f.emergencyCare ? 'Yes' : 'No'}</strong></span>
                  <span>Contact: <strong className="font-mono">{f.contact || '104'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
