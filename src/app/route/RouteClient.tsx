"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigation, CheckCircle, BellRing, ShieldAlert, HeartPulse } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { offlineQueue } from '@/lib/offlineQueue';
import ConnectivityStatus from '@/components/ConnectivityStatus';
import { getPatientHealthProfile } from '@/actions/health';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function RouteClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fid = searchParams.get('fid');
  const mode = searchParams.get('mode'); // 'normal' or 'emergency'

  const [arrived, setArrived] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [handoverResult, setHandoverResult] = useState<any>(null);
  const [ending, setEnding] = useState(false);
  const [userHealthId, setUserHealthId] = useState<string | null>(null);

  // Default positions for demo
  const userPos: [number, number] = [20.0, 73.78];
  const hospPos: [number, number] = [20.0059, 73.7900];

  useEffect(() => {
    // Load patient health ID for offline display if available
    getPatientHealthProfile().then(res => {
      if (res?.data?.healthId) {
        setUserHealthId(res.data.healthId);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let alertTimer: any;
    if (mode === 'emergency') {
      alertTimer = setTimeout(() => {
        setAlertSent(true);
      }, 1500);
    }

    const arriveTimer = setTimeout(() => {
      setArrived(true);
    }, 4000);
    
    return () => {
      clearTimeout(alertTimer);
      clearTimeout(arriveTimer);
    };
  }, [mode]);

  const handleEndEmergency = async () => {
    setEnding(true);
    const connState = offlineQueue.getConnectionState();

    // STRICT OFFLINE CHECK: If user set simulator to OFFLINE or browser is offline
    if (connState === 'OFFLINE') {
      const targetHealthId = userHealthId || 'ARX-OFFLINE-BUFFERED';
      const queued = offlineQueue.enqueue({
        healthId: targetHealthId,
        facilityId: fid || 'unknown',
        facilityName: 'Destination Hospital',
        summary: {
          chiefComplaint: 'Road Accident',
          triageCategory: 'critical',
          vitals: {
            consciousness: 'unconscious',
            breathing: 'normal',
            bleeding: 'severe'
          },
          timestamp: new Date().toISOString()
        }
      });

      setHandoverResult({
        success: true,
        offlineQueued: true,
        healthId: queued.healthId,
        packetId: queued.id
      });
      setEnding(false);
      return;
    }

    // ONLINE MODE: Transmit directly to server
    try {
      const { endEmergencySession } = await import('@/actions/journey');
      const res = await endEmergencySession({
        incident_type: 'accident',
        consciousness: 'unconscious',
        bleeding: 'severe',
        breathing: 'normal',
        urgency: 'critical',
        facilityId: fid,
        distanceKm: 4.2,
        etaMins: 12
      });

      if (res.success) {
        setHandoverResult(res);
      } else {
        // Fallback: offline queue
        const queued = offlineQueue.enqueue({
          healthId: userHealthId || 'ARX-FALLBACK-OFFLINE',
          facilityId: fid || 'unknown',
          facilityName: 'Destination Hospital',
          summary: {
            chiefComplaint: 'Road Accident',
            triageCategory: 'critical',
            vitals: {
              consciousness: 'unconscious',
              breathing: 'normal',
              bleeding: 'severe'
            },
            timestamp: new Date().toISOString()
          }
        });
        setHandoverResult({ success: true, offlineQueued: true, healthId: queued.healthId });
      }
    } catch {
      // Offline fallback queue
      const queued = offlineQueue.enqueue({
        healthId: userHealthId || 'ARX-FALLBACK-OFFLINE',
        facilityId: fid || 'unknown',
        facilityName: 'Destination Hospital',
        summary: {
          chiefComplaint: 'Emergency Incident',
          triageCategory: 'critical',
          vitals: { consciousness: 'unknown', breathing: 'unknown', bleeding: 'unknown' },
          timestamp: new Date().toISOString()
        }
      });
      setHandoverResult({ success: true, offlineQueued: true, healthId: queued.healthId });
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Route Header with Connectivity Widget */}
      <div className="bg-blue-600 text-white p-4 pt-6 shadow-md z-10 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Navigation size={22} />
            Navigating to Hospital
          </h1>
          <div className="bg-white/10 rounded-xl p-1 backdrop-blur-xs">
            <ConnectivityStatus />
          </div>
        </div>
        
        {/* Hospital Alert Signal UI - ONLY FOR EMERGENCY */}
        {mode === 'emergency' && (
          <div className={`mt-3 p-3 rounded-xl flex items-center gap-3 transition-colors ${alertSent ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
            {alertSent ? <CheckCircle size={22} /> : <BellRing size={22} />}
            <div className="flex-1">
              <p className="font-bold text-sm">{alertSent ? 'Emergency Alert Confirmed' : 'Transmitting Emergency Handover...'}</p>
              <p className="text-xs text-white/90">
                {alertSent 
                  ? 'Hospital emergency desk received vitals & ETA packet.' 
                  : 'Connecting via AarogNex Handover Protocol...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="flex-1 relative bg-gray-200 z-0 h-[45vh]">
        <MapComponent userPos={userPos} hospPos={hospPos} hospitalName="Destination Hospital" />
      </div>

      <div className="bg-white p-6 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 relative -mt-4">
        {!arrived ? (
          <div className="text-center py-4">
            <h2 className="text-3xl font-bold text-gray-800">12 min</h2>
            <p className="text-gray-500 font-semibold mb-4 text-xs">4.2 km • ETA 14:45</p>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&origin=${userPos[0]},${userPos[1]}&destination=${hospPos[0]},${hospPos[1]}&travelmode=driving`}
              target="_blank" rel="noopener noreferrer"
              className="inline-block w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold mb-2 hover:bg-gray-50 transition-colors text-xs"
            >
              Open in Google Maps
            </a>
          </div>
        ) : (
          <div className="text-center py-2 animate-in fade-in slide-in-from-bottom-4">
            {mode === 'emergency' ? (
              <>
                <ShieldAlert className="text-red-500 w-12 h-12 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-gray-800 mb-1">Emergency Team Ready</h2>
                <p className="text-gray-500 mb-4 text-xs">
                  Arrived at destination hospital. Complete handover with the triage staff.
                </p>

                {handoverResult ? (
                  <div className={`border-2 rounded-2xl p-4 text-left mb-4 space-y-2.5 transition-all shadow-sm ${
                    handoverResult.offlineQueued
                      ? 'bg-amber-50/90 border-amber-300'
                      : 'bg-teal-50/90 border-teal-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${
                        handoverResult.offlineQueued ? 'text-amber-900' : 'text-teal-900'
                      }`}>
                        <HeartPulse className={`w-4 h-4 ${handoverResult.offlineQueued ? 'text-amber-600' : 'text-teal-600'}`} />
                        <span>{handoverResult.offlineQueued ? 'Handover Queued (Offline Buffer)' : 'Handover Packet Confirmed'}</span>
                      </div>
                      {handoverResult.offlineQueued && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold animate-pulse">
                          OFFLINE QUEUED
                        </span>
                      )}
                    </div>

                    {handoverResult.healthId && (
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">AarogNex Health ID</span>
                        <span className="font-mono font-bold text-gray-900 text-base select-all">{handoverResult.healthId}</span>
                      </div>
                    )}

                    <div className={`p-2.5 rounded-xl border text-xs font-medium leading-relaxed ${
                      handoverResult.offlineQueued
                        ? 'bg-amber-100/60 border-amber-200 text-amber-900'
                        : 'bg-white border-teal-100 text-teal-800'
                    }`}>
                      {handoverResult.offlineQueued
                        ? 'Handover queued in local offline store. Auto-sync will complete on network reconnect.'
                        : 'Minimal necessary emergency handover saved and linked to patient ID.'}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => router.push('/patient-home')}
                        className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs transition-colors ${
                          handoverResult.offlineQueued
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-teal-600 hover:bg-teal-700'
                        }`}
                      >
                        Patient Home
                      </button>
                      <button
                        onClick={() => router.push('/records')}
                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                      >
                        View Records
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleEndEmergency}
                    disabled={ending}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50 text-sm"
                  >
                    {ending ? 'Completing Handover...' : 'Complete Emergency Handover'}
                  </button>
                )}
              </>
            ) : (
              <>
                <CheckCircle className="text-green-500 w-12 h-12 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-gray-800 mb-1">Arrived at Clinic</h2>
                <p className="text-gray-500 mb-4 text-xs">You have reached the healthcare facility.</p>
                <button 
                  onClick={() => router.push(`/care-journey?fid=${fid}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-md active:scale-95 transition-transform text-sm"
                >
                  Continue to Care Journey
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
