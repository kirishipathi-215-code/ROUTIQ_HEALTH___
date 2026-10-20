"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoice } from '@/hooks/useVoice';
import { getAIService, AIResponse } from '@/services/AIService';
import { Phone, Mic, MicOff, AlertTriangle, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConnectivityStatus from '@/components/ConnectivityStatus';

export default function EmergencyClient() {
  const { t } = useLanguage();
  const { isListening, transcript, startListening, stopListening, speak } = useVoice();
  const [step, setStep] = useState(1);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [clarificationWarning, setClarificationWarning] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        if (parsed && parsed.is_healthcare_related !== false) {
          setAiData(parsed);
          setStep(3);
        }
      } catch(e){}
    } else {
      speak(t('emergency_instruction'));
    }
  }, []);

  useEffect(() => {
    if (!isListening && transcript && step === 2) {
      processEmergencySpeech(transcript);
    }
  }, [isListening, transcript]);

  const processEmergencySpeech = async (text: string) => {
    if (!text.trim()) return;

    const ai = getAIService();
    const result = await ai.processInput(text, 'EMERGENCY');

    // Part 9: Emergency mode confirmation safety gate - Irrelevant input guard
    if (!result.is_healthcare_related || result.requires_clarification) {
      setClarificationWarning(result.response_text);
      speak(result.response_text, result.response_language);
      return;
    }

    setClarificationWarning('');
    setAiData(result);
    setStep(3);
    speak(result.response_text || (t('understood_info') + " " + t('confirm_info')), result.response_language);
  };

  const handleConfirm = () => {
    if (aiData) {
      router.push(`/match?data=${encodeURIComponent(JSON.stringify(aiData))}&confirmed=true`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-red-50 p-4">
      {/* Top Banner with Connectivity Status */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h1 className="text-xl font-bold text-red-900 flex items-center gap-2">
          <AlertTriangle className="text-red-600" />
          {t('medical_emergency')}
        </h1>
        <ConnectivityStatus />
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-red-100 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">{t('call_108')}</h2>
            <p className="text-gray-600 mb-6 text-sm">
              {t('emergency_instruction')}
            </p>
            <a 
              href="tel:108" 
              className="inline-flex items-center justify-center gap-3 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-lg text-lg transition-transform active:scale-95"
            >
              <Phone size={24} />
              <span>{t('call_108')}</span>
            </a>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-red-100 text-center">
            <h3 className="font-semibold text-gray-800 mb-4">{t('inside_ambulance')}</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                {t('yes')}
              </button>
              <button 
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-all"
              >
                {t('not_yet')}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-red-100 w-full flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('tell_us_what_happened')}</h2>
            <p className="text-sm text-gray-500 mb-6">Mention accidents, symptoms, breathing, or injuries.</p>

            {clarificationWarning && (
              <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs text-left flex items-start gap-2 animate-in fade-in">
                <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{clarificationWarning}</span>
              </div>
            )}

            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-xl mb-4 ${
                isListening 
                  ? 'bg-red-600 animate-pulse text-white scale-105' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isListening ? <Mic size={40} /> : <MicOff size={40} />}
            </button>
            <span className="text-sm font-semibold text-gray-600">
              {isListening ? t('listening') : t('speak_emergency')}
            </span>

            {transcript && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-gray-800 italic w-full">
                "{transcript}"
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && aiData && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-red-200 w-full">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-4 pb-2 border-b border-red-100">
              <AlertTriangle size={20} />
              <h2 className="text-lg">{t('emergency_confirm_title') || "Emergency Details Confirmation"}</h2>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Incident:</span>
                <span className="font-bold text-gray-800 capitalize">{aiData.incident_type || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Consciousness:</span>
                <span className="font-bold text-gray-800 capitalize">{aiData.consciousness || 'Alert'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Bleeding:</span>
                <span className="font-bold text-gray-800 capitalize">{aiData.bleeding || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Breathing:</span>
                <span className="font-bold text-gray-800 capitalize">{aiData.breathing || 'Normal'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Urgency Triage:</span>
                <span className={`font-bold uppercase ${aiData.urgency === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                  {aiData.urgency || 'Critical'}
                </span>
              </div>
            </div>

            {aiData.response_text && (
              <p className="text-xs text-gray-600 mb-6 bg-red-50 p-3 rounded-xl border border-red-100 italic">
                "{aiData.response_text}"
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirm} 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                <span>{t('confirm_and_find') || "✓ Confirm & Find Hospital"}</span>
              </button>
              <button 
                onClick={() => { setStep(2); setClarificationWarning(''); }} 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold border flex items-center justify-center gap-2"
              >
                <XCircle size={18} className="text-gray-500" />
                <span>{t('correct_info') || "✕ Correct Information"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
