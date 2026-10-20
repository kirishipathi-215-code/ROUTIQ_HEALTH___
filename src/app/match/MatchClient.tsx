"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AIResponse } from '@/services/AIService';
import type { MatchResult } from '@/services/MatchingEngine';
import { findMatch } from '@/actions/match';
import { MapPin, Navigation, CheckCircle2, Clock, Info, X, Phone, Activity, Building, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVoice } from '@/hooks/useVoice';
import ConnectivityStatus from '@/components/ConnectivityStatus';

export default function MatchClient() {
  const { t } = useLanguage();
  const { speak } = useVoice();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<MatchResult | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    const confirmedParam = searchParams.get('confirmed') === 'true';

    if (!dataParam) {
      setErrorMessage("No healthcare request provided. Please use the voice assistant first.");
      setLoading(false);
      return;
    }

    try {
      const parsed: AIResponse = JSON.parse(decodeURIComponent(dataParam));
      setAiData(parsed);

      // PART 3 & PART 11 HEALTHCARE INTENT GATE
      if (parsed.is_healthcare_related === false) {
        setErrorMessage("Input is not healthcare-related. Facility matching was blocked.");
        setLoading(false);
        return;
      }

      if (parsed.requires_confirmation && !confirmedParam) {
        setErrorMessage("Confirmation is required before searching for healthcare facilities.");
        setLoading(false);
        return;
      }

      findMatch({ aiData: parsed, confirmed: true }).then((res) => {
        setMatches(res || []);
        setLoading(false);

        // PART 6 & 7: Speak facility recommendation after confirmation
        if (res && res.length > 0) {
          const spoken = parsed.intent === 'emergency'
            ? (t('finding_suitable_care') || "Suitable emergency facility found. Starting route.")
            : (t('facility_recommended_spoken') || "I found a suitable nearby healthcare facility that provides general medical consultation and is currently marked as available. Please visit the recommended facility for evaluation.");
          speak(spoken);
        }
      }).catch((err) => {
        console.error("Match error:", err);
        setErrorMessage("Error searching for healthcare facilities. Please try again.");
        setLoading(false);
      });
    } catch (e) {
      setErrorMessage("Failed to process healthcare request payload.");
      setLoading(false);
    }
  }, [searchParams, t, speak]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">{t('finding_suitable_care')}</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-sm">
          Matching capabilities, real-time availability, and route distances...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-10 text-center">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-6">
          <ShieldAlert className="text-red-500 mx-auto mb-2" size={36} />
          <h3 className="font-bold text-red-900 text-lg">Request Blocked</h3>
          <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
        </div>
        <button
          onClick={() => router.push('/patient-home')}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition"
        >
          Return to Assistant
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-20">
      <ConnectivityStatus />

      {/* Header Context */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
            aiData?.intent === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {aiData?.intent === 'emergency' ? 'Emergency Care' : 'General Care'}
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">
            {matches.length} Facilities Recommended
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by capability match, specialist readiness, and proximity.
          </p>
        </div>
        <button
          onClick={() => router.push('/patient-home')}
          className="text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
        >
          New Search
        </button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {matches.map((item, idx) => {
          const isTop = idx === 0;
          return (
            <div
              key={item.facility.id}
              className={`bg-white rounded-2xl p-5 border transition shadow-sm ${
                isTop ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {isTop && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-2">
                  <CheckCircle2 size={14} />
                  <span>BEST MATCH (Ranked #1)</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-snug">
                    {item.facility.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {item.distanceKm.toFixed(1)} km away
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      ~{item.estimatedTimeMin} mins
                    </span>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-200">
                  {Math.round(item.matchScore)}% Match
                </span>
              </div>

              {/* Match Reasons */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.reasons.map((r, i) => (
                  <span key={i} className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                    ✓ {r}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedHospital(item)}
                  className="flex-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition text-center"
                >
                  View Details
                </button>
                <button
                  onClick={() => router.push(`/route?fid=${item.facility.id}&mode=${aiData?.intent === 'emergency' ? 'emergency' : 'normal'}`)}
                  className={`flex-[2] flex items-center justify-center gap-1.5 text-xs font-bold text-white py-2.5 rounded-xl shadow-sm transition active:scale-95 ${
                    aiData?.intent === 'emergency' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Navigation size={14} />
                  Start Route
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Facility Details Modal */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {selectedHospital.facility.type}
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedHospital.facility.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedHospital(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-500 shrink-0" />
                <span>{selectedHospital.facility.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-emerald-500 shrink-0" />
                <span>{selectedHospital.facility.contact || 'Contact facility directly'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-500 shrink-0" />
                <span>Status: Available (Verified)</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <Info size={14} /> Medical Disclaimer
              </p>
              {t('facility_available_disclaimer')}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedHospital(null)}
                className="flex-1 py-3 text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-sm"
              >
                Close
              </button>
              <button
                onClick={() => router.push(`/route?fid=${selectedHospital.facility.id}&mode=${aiData?.intent === 'emergency' ? 'emergency' : 'normal'}`)}
                className={`flex-[2] flex justify-center items-center gap-2 text-white py-3 rounded-xl font-bold shadow-md transition-transform active:scale-95 ${
                  aiData?.intent === 'emergency' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Navigation size={18} fill="white" />
                Start Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
