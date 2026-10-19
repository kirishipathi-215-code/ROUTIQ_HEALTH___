'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { lookupPatientEmergencySummary } from '@/actions/hospital';
import { logout } from '@/actions/auth';
import ConnectivityStatus from '@/components/ConnectivityStatus';

export default function HospitalDashboardClient() {
  const router = useRouter();
  const [searchHealthId, setSearchHealthId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [admitted, setAdmitted] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHealthId.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setAdmitted(false);

    try {
      const res = await lookupPatientEmergencySummary(searchHealthId.trim());
      if (res.success) {
        setResult(res.data);
      } else {
        if (res.error?.includes('Unauthorized')) {
          router.push('/login');
          return;
        }
        setError(res.error || 'Failed to locate emergency packet.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = () => {
    setAdmitted(true);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-lg">
              H
            </span>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">AarogNex Hospital Portal</h1>
              <p className="text-[10px] text-blue-700 font-medium tracking-wide uppercase">
                Emergency Handover & Triage Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectivityStatus />
            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono">
              Staff Portal
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

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Search Bar for Health ID */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Emergency Patient Lookup</h2>
            <p className="text-xs text-slate-500">
              Enter the patient&apos;s AarogNex Health ID provided by 108 ambulance crew or patient attendant.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[260px] relative">
              <input
                type="text"
                value={searchHealthId}
                onChange={(e) => setSearchHealthId(e.target.value)}
                placeholder="ARX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-2.5 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchHealthId.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">↻</span>
                  <span>Fetching Packet...</span>
                </>
              ) : (
                <span>Retrieve Handover Packet</span>
              )}
            </button>
          </form>

          {/* Quick Demo shortcuts */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span>Sample IDs for verification:</span>
            <button
              type="button"
              onClick={() => setSearchHealthId('ARX-TEST-PATIENT-01')}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700"
            >
              ARX-TEST-PATIENT-01
            </button>
            <span className="text-slate-300">|</span>
            <span>Lookup is strictly audit-logged for patient privacy.</span>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Retrieved Emergency Summary Packet */}
        {result && (
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-6 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                  Emergency Handover Packet
                </span>
                <h3 className="text-xl font-mono font-bold text-slate-900 mt-1">
                  {result.healthId}
                </h3>
                <p className="text-xs text-slate-500">
                  Patient Name: <strong className="text-slate-800">{result.patientName}</strong> • Age:{' '}
                  {result.age || 'N/A'} • Gender: {result.gender || 'N/A'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Emergency Contact:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {result.emergencyContact || 'None Listed'}
                </span>
              </div>
            </div>

            {/* Critical Allergies Alert */}
            <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/70 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>Critical Allergies (Mandatory Check Prior to Medication)</span>
              </div>
              {result.allergies && result.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.allergies.map((allergy: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs"
                    >
                      ⚠️ {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-rose-700 italic">
                  No known medication or substance allergies reported by patient.
                </p>
              )}
            </div>

            {/* Conditions, Medications & Surgeries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Existing Conditions
                </h4>
                {result.existingConditions && result.existingConditions.length > 0 ? (
                  <ul className="space-y-1">
                    {result.existingConditions.map((c: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">None reported</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Current Medications
                </h4>
                {result.medications && result.medications.length > 0 ? (
                  <ul className="space-y-1">
                    {result.medications.map((m: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">None reported</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Past Surgeries
                </h4>
                {result.previousSurgeries && result.previousSurgeries.length > 0 ? (
                  <ul className="space-y-1">
                    {result.previousSurgeries.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">None reported</p>
                )}
              </div>
            </div>

            {/* Active Triage Status from Handover */}
            {result.latestEmergencyHandover ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-900 uppercase tracking-wider">
                    Inbound Triage Assessment
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Handover ID: {result.latestEmergencyHandover.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Incident</span>
                    <span className="font-semibold capitalize text-slate-800">
                      {result.latestEmergencyHandover.incidentType || 'Medical Emergency'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Consciousness</span>
                    <span className="font-semibold capitalize text-slate-800">
                      {result.latestEmergencyHandover.consciousness || 'Alert'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Breathing</span>
                    <span className="font-semibold capitalize text-slate-800">
                      {result.latestEmergencyHandover.breathing || 'Normal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Bleeding</span>
                    <span className="font-semibold capitalize text-slate-800">
                      {result.latestEmergencyHandover.bleeding || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                Direct walk-in patient. No prior inbound 108 dispatch packet attached.
              </div>
            )}

            {/* Admission Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Audit event recorded: Staff access authorized for Emergency Care.</span>
              </div>

              <div className="flex gap-2">
                {admitted ? (
                  <div className="px-5 py-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Patient Admitted to Emergency Ward</span>
                  </div>
                ) : (
                  <button
                    onClick={handleAdmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Accept Handover & Admit Patient
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
