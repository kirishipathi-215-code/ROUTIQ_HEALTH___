"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Stethoscope, ShieldAlert, CheckCircle2, Clock, X, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientNavigation from '@/components/PatientNavigation';

export default function RecordsClient({ user, emergencyEvents, careJourneys }: { user: any, emergencyEvents: any[], careJourneys: any[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center gap-3">
        <Link href="/patient-home">
          <ArrowLeft className="text-slate-300 hover:text-white" />
        </Link>
        <h1 className="text-xl font-bold">{t('my_records') || 'My Records'}</h1>
      </header>

      <main className="flex-1 p-4 pb-20">
        
        {emergencyEvents.length === 0 && careJourneys.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No records found.</div>
        )}

        {emergencyEvents.map(event => (
          <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <ShieldAlert size={18} /> Emergency Journey
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">{event.status}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{event.facility?.name || 'Unknown Facility'}</h3>
              <p className="text-sm text-gray-500 mb-4">{new Date(event.startTime).toLocaleString()}</p>

              <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Incident:</span>
                  <span className="font-semibold text-gray-900">{event.incidentType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Condition:</span>
                  <span className="font-semibold text-red-600">{event.consciousness}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Distance traveled:</span>
                  <span className="font-semibold text-gray-900">{event.distanceKm} km (~{event.etaMins} min)</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedEmergency(event)}
                className="w-full text-blue-600 font-bold text-sm border-2 border-blue-100 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Complete Report
              </button>
            </div>
          </div>
        ))}

        {careJourneys.map(journey => (
          <div key={journey.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-700 font-bold">
                <Stethoscope size={18} /> Normal Care
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{journey.status}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{t(journey.detectedNeed || 'Unknown Need')}</h3>
              <p className="text-sm text-gray-500 mb-4">{new Date(journey.createdAt).toLocaleString()} • {journey.facility?.name}</p>

              <div className="space-y-4 relative border-l-2 border-gray-200 ml-2 mb-4">
                {journey.steps.map((step: any) => (
                  <div key={step.id} className="relative pl-6">
                    <div className={`absolute -left-2 top-0 text-white p-0.5 rounded-full z-10 ${step.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}>
                      {step.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">{step.stepName}</h4>
                    <p className="text-xs text-gray-500">{step.status}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => router.push(`/care-journey?jid=${journey.id}`)}
                className="w-full bg-blue-600 text-white font-bold text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Journey
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Report Modal */}
      {selectedEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={20} />
                <h2 className="font-bold text-lg">Emergency Report</h2>
              </div>
              <button onClick={() => setSelectedEmergency(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Hospital Details</h3>
                <div className="bg-white p-4 rounded-xl border">
                  <p className="font-bold text-gray-900 text-lg">{selectedEmergency.facility?.name}</p>
                  <p className="text-gray-600 text-sm">{selectedEmergency.facility?.type} • {selectedEmergency.facility?.address}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Incident Data</h3>
                <div className="bg-white p-4 rounded-xl border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Incident Type</p>
                    <p className="font-bold text-gray-900">{selectedEmergency.incidentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Severity</p>
                    <p className="font-bold text-red-600">{selectedEmergency.urgency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Consciousness</p>
                    <p className="font-bold text-gray-900">{selectedEmergency.consciousness}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bleeding</p>
                    <p className="font-bold text-gray-900">{selectedEmergency.bleeding}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Journey Timeline</h3>
                <div className="bg-white p-4 rounded-xl border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{new Date(selectedEmergency.startTime).toLocaleTimeString()}</span>
                    <span className="font-medium text-gray-900 text-right">Emergency Started</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-bold">{selectedEmergency.arrivalTime ? new Date(selectedEmergency.arrivalTime).toLocaleTimeString() : 'Pending'}</span>
                    <span className="font-bold text-green-700 text-right">Arrived at Destination</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-white shrink-0">
              <button 
                onClick={() => setSelectedEmergency(null)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Bottom Navigation */}
      <PatientNavigation />
    </div>
  );
}
