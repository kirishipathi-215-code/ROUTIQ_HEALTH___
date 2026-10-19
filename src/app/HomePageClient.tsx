"use client";

import { useState } from 'react';
import VoiceAssistant from '../components/VoiceAssistant';
import LanguageSelector from '../components/LanguageSelector';
import ConnectivityStatus from '../components/ConnectivityStatus';
import { useLanguage } from '../contexts/LanguageContext';
import { Stethoscope, ShieldAlert, FileText, LogOut, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { AIResponse } from '@/services/AIService';

export default function HomePageClient({ user }: { user: any }) {
  const { t, hasSelectedLanguage } = useLanguage();
  const [aiData, setAiData] = useState<AIResponse | null>(null);

  const handleAIResponse = (data: AIResponse) => {
    setAiData(data);
    if (data.intent === 'emergency') {
      window.location.href = `/emergency?data=${encodeURIComponent(JSON.stringify(data))}`;
    } else {
      window.location.href = `/match?data=${encodeURIComponent(JSON.stringify(data))}&confirmed=true`;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 bg-gray-50 pb-20 text-gray-800">
      <header className="w-full max-w-xl flex flex-wrap justify-between items-center py-4 px-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-lg">
            A
          </span>
          <h1 className="text-2xl font-extrabold text-teal-700">AarogNex</h1>
        </div>

        <div className="flex items-center gap-2">
          <ConnectivityStatus />
          {hasSelectedLanguage && <LanguageSelector compact={true} />}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-xs border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[11px] font-bold text-gray-700 uppercase">{user.role}</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-md">
        {!hasSelectedLanguage ? (
          <LanguageSelector compact={false} />
        ) : (
          <>
            {/* AarogNex Health ID Quick Card */}
            <Link href="/patient-dashboard" className="block mb-6">
              <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all border border-teal-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-teal-300" />
                    <span className="font-bold text-sm">AarogNex Health ID</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
                    {user.healthId || 'View ID'}
                  </span>
                </div>
                <p className="text-xs text-teal-100">
                  Manage personal health history, allergies & voice records →
                </p>
              </div>
            </Link>

            <VoiceAssistant onAIResponse={handleAIResponse} />

            <div className="mt-8">
              <p className="text-gray-500 mb-4 font-semibold text-center uppercase tracking-wide text-xs">
                Or select an option below
              </p>
              <div className="grid grid-cols-1 gap-4">
                <Link href="/emergency">
                  <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100 flex items-center shadow-xs active:scale-95 transition-transform">
                    <div className="bg-red-100 p-3 rounded-full mr-4">
                      <ShieldAlert className="text-red-600" size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-700">{t('emergency_care')}</h3>
                      <p className="text-red-600/80 text-xs">{t('accident')} or critical emergency?</p>
                    </div>
                  </div>
                </Link>

                {user.role !== 'AMBULANCE_HELPER' && (
                  <Link href="/normal">
                    <div className="bg-white p-6 rounded-2xl border flex items-center shadow-xs active:scale-95 transition-transform">
                      <div className="bg-teal-50 p-3 rounded-full mr-4">
                        <Stethoscope className="text-teal-600" size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{t('normal_care')}</h3>
                        <p className="text-gray-500 text-xs">Tell us what you need</p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <Link href="/records">
                <div className="bg-white p-4 rounded-xl border flex flex-col items-center shadow-xs active:scale-95 transition-transform hover:bg-gray-50">
                  <FileText className="text-green-600 mb-2" size={24} />
                  <span className="font-semibold text-gray-700 text-xs">{t('my_records')}</span>
                </div>
              </Link>
              
              <button
                onClick={() => {
                  document.cookie = 'aarognex_session=; Max-Age=0; path=/';
                  window.location.href = '/login';
                }}
                className="bg-white p-4 rounded-xl border flex flex-col items-center shadow-xs active:scale-95 transition-transform hover:bg-gray-50"
              >
                <LogOut className="text-gray-500 mb-2" size={24} />
                <span className="font-semibold text-gray-700 text-xs">Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
