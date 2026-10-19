'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getGovernmentHealthAnalytics } from '@/actions/government';
import { logout } from '@/actions/auth';
import ConnectivityStatus from '@/components/ConnectivityStatus';

export default function GovernmentDashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await getGovernmentHealthAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      } else {
        if (res.error?.includes('Unauthorized')) {
          router.push('/login');
          return;
        }
        setError(res.error || 'Failed to load health analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with database');
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">
        Aggregating public health records from PostgreSQL...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-lg">
              G
            </span>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">National Health Authority</h1>
              <p className="text-[10px] text-emerald-700 font-medium tracking-wide uppercase">
                AarogNex Regional Analytics & Access Point Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectivityStatus />
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
              Authority View
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Privacy Banner */}
        <section className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 uppercase tracking-wider">
                De-Identified Public Health Stream
              </span>
              <span className="text-xs text-emerald-300 font-mono">Live PostgreSQL Aggregation</span>
            </div>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              In accordance with health data governance protocols, this view displays strictly de-identified,
              aggregated emergency demand, regional triage volumes, and healthcare facility availability.
              Zero patient identities, phone numbers, or private medical histories are exposed.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>↻</span>
            <span>Refresh Metrics</span>
          </button>
        </section>

        {error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* High-Level KPI Summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Emergency Incidents
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">
              {analytics?.summary?.totalEmergencies ?? 0}
            </div>
            <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <span>●</span> {analytics?.summary?.criticalTriage ?? 0} critical priority
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Care Navigations
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">
              {analytics?.summary?.totalCareJourneys ?? 0}
            </div>
            <span className="text-[11px] text-teal-600 font-medium flex items-center gap-1 mt-1">
              <span>✓</span> OPD & Specialist queries
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Monitored Facilities
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">
              {analytics?.summary?.totalFacilities ?? 0}
            </div>
            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-1">
              <span>🏥</span> {analytics?.summary?.availableFacilities ?? 0} currently available
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Avg Handover Distance
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-1 font-mono">
              {analytics?.summary?.averageMatchingDistanceKm ?? 0} <span className="text-sm font-normal text-slate-500">km</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              <span>⚡</span> Haversine routing
            </span>
          </div>
        </section>

        {/* Breakdown Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Triage Severity Distribution */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Emergency Triage Severity Breakdown</h3>
              <span className="text-[11px] text-slate-400">PostgreSQL Live Count</span>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    Critical Cases (Immediate Resuscitation)
                  </span>
                  <span className="font-mono font-bold text-slate-900">{analytics?.triageBreakdown?.critical ?? 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        analytics?.summary?.totalEmergencies
                          ? (analytics.triageBreakdown.critical / analytics.summary.totalEmergencies) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    High Priority (Urgent Stabilization)
                  </span>
                  <span className="font-mono font-bold text-slate-900">{analytics?.triageBreakdown?.high ?? 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        analytics?.summary?.totalEmergencies
                          ? (analytics.triageBreakdown.high / analytics.summary.totalEmergencies) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Moderate / Stable (Primary Evaluation)
                  </span>
                  <span className="font-mono font-bold text-slate-900">{analytics?.triageBreakdown?.moderate ?? 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        analytics?.summary?.totalEmergencies
                          ? (analytics.triageBreakdown.moderate / analytics.summary.totalEmergencies) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Incident Type Breakdown */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Emergency Incident Categories</h3>
              <span className="text-[11px] text-slate-400">Aggregated Events</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase">Road / Trauma Accidents</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {analytics?.incidentBreakdown?.accidents ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Polytrauma, fracture, collisions</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase">Cardiac & Stroke</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {analytics?.incidentBreakdown?.cardiac ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Chest pain, arrest, acute coronary</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase">Respiratory & Choking</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {analytics?.incidentBreakdown?.respiratory ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Severe dyspnea, acute distress</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block uppercase">General Medical Urgent</span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {analytics?.incidentBreakdown?.generalEmergency ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Acute abdominal, sepsis, burns</span>
              </div>
            </div>
          </section>
        </div>

        {/* AarogNex Health Access Point Network Monitor */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Decentralized &ldquo;AarogNex Health Access Point&rdquo; Mesh
              </h3>
              <p className="text-xs text-slate-500">
                Community kiosk and PHC nodes serving connectivity-constrained rural and peri-urban districts.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              Mesh Status: Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 font-mono">HAP-MH-RUR-001</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Online</span>
              </div>
              <p className="text-slate-600 text-[11px]">Shirwal Rural Health Center, Satara</p>
              <div className="text-[10px] text-slate-400 pt-1">Sync Latency: 42ms • Offline Queue: 0</div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 font-mono">HAP-MH-RUR-004</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Weak Cellular</span>
              </div>
              <p className="text-slate-600 text-[11px]">Khed Community Access Kiosk, Pune</p>
              <div className="text-[10px] text-slate-400 pt-1">Sync Latency: 1.4s • Offline Queue: 2 queued</div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 font-mono">HAP-TN-RUR-008</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Online</span>
              </div>
              <p className="text-slate-600 text-[11px]">Chengalpattu Rural Primary Center</p>
              <div className="text-[10px] text-slate-400 pt-1">Sync Latency: 56ms • Offline Queue: 0</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
