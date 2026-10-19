"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoice } from '@/hooks/useVoice';
import { getAIService, AIResponse } from '@/services/AIService';
import { updatePatientLanguage } from '@/actions/health';
import { logout } from '@/actions/auth';
import PatientNavigation from '@/components/PatientNavigation';
import LanguageSelector from '@/components/LanguageSelector';
import { 
  Mic, 
  MicOff, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Keyboard, 
  Volume2, 
  ShieldAlert, 
  Stethoscope, 
  LogOut,
  Globe
} from 'lucide-react';

interface PatientHomeClientProps {
  user: any;
}

export default function PatientHomeClient({ user }: PatientHomeClientProps) {
  const router = useRouter();
  const { locale, setLocale, t, hasSelectedLanguage, confirmLanguage } = useLanguage();
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak } = useVoice();

  const [hasGreeted, setHasGreeted] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Safety gate states
  const [pendingResponse, setPendingResponse] = useState<AIResponse | null>(null);
  const [clarificationWarning, setClarificationWarning] = useState<string | null>(null);

  // Auto-load preferred language from user profile if not selected in context
  useEffect(() => {
    if (!hasSelectedLanguage && user.patientProfile?.preferredLanguage) {
      const saved = user.patientProfile.preferredLanguage as 'en' | 'hi' | 'mr' | 'ta';
      if (['en', 'hi', 'mr', 'ta'].includes(saved)) {
        confirmLanguage(saved);
      }
    }
  }, [hasSelectedLanguage, user]);

  // Initial spoken greeting once language is established
  useEffect(() => {
    if (hasSelectedLanguage && !hasGreeted) {
      setHasGreeted(true);
      const greeting = t('how_can_i_help_today') || t('welcome');
      speak(greeting, locale);
    }
  }, [hasSelectedLanguage, hasGreeted, speak, t, locale]);

  // Handle voice transcript arrival
  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 0 && !pendingResponse) {
      handleProcessInput(transcript);
    }
  }, [isListening, transcript]);

  // Process natural language input (voice or typed) through Intent Validation & Safety Gates
  const handleProcessInput = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setClarificationWarning(null);

    try {
      const ai = getAIService();
      const result = await ai.processInput(text, 'NORMAL');

      // Sync response language if detected
      if (result.response_language && ['en', 'mr', 'hi', 'ta'].includes(result.response_language)) {
        setLocale(result.response_language as 'en' | 'mr' | 'hi' | 'ta');
      }

      // GATE 1: Chit-chat or insufficient information -> Clarification only, NO matching
      if (!result.is_healthcare_related || result.requires_clarification) {
        setClarificationWarning(result.response_text);
        setPendingResponse(null);
        speak(result.response_text, result.response_language || locale);
        setIsProcessing(false);
        return;
      }

      // GATE 2: Healthcare concern identified -> Require explicit confirmation
      setPendingResponse(result);
      setClarificationWarning(null);
      speak(result.response_text, result.response_language || locale);
    } catch (err) {
      console.error('Failed to process healthcare request:', err);
      const errPrompt = t('error_understanding');
      setClarificationWarning(errPrompt);
      speak(errPrompt, locale);
    } finally {
      setIsProcessing(false);
    }
  };

  // When patient confirms "Yes, Continue"
  const handleConfirmYes = () => {
    if (!pendingResponse) return;

    // Spoken feedback in patient's language
    const spokenFeedback = t('finding_suitable_care') || "Finding suitable healthcare for you...";
    speak(spokenFeedback, pendingResponse.response_language || locale);

    if (pendingResponse.intent === 'emergency') {
      router.push(`/emergency?data=${encodeURIComponent(JSON.stringify(pendingResponse))}`);
    } else {
      router.push(`/match?data=${encodeURIComponent(JSON.stringify(pendingResponse))}&confirmed=true`);
    }
  };

  // When patient rejects or wants to speak again
  const handleRejectNo = () => {
    setPendingResponse(null);
    setClarificationWarning(null);
    const retryPrompt = t('speak_health_problem') || "Please speak your health problem again.";
    speak(retryPrompt, locale);
  };

  const handleLanguagePick = async (lang: 'en' | 'hi' | 'mr' | 'ta') => {
    confirmLanguage(lang);
    await updatePatientLanguage(lang);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // =========================================================================
  // SCREEN 1: FIRST-TIME LANGUAGE SELECTION
  // =========================================================================
  if (!hasSelectedLanguage) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 text-slate-800">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white font-black text-3xl shadow-md">
            A
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              AarogNex
            </h1>
            <p className="text-xs text-teal-700 font-bold uppercase tracking-wider">
              {t('assistant_subtitle') || 'Your Healthcare Assistant'}
            </p>
          </div>

          {/* Multilingual Title Banner */}
          <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-4 space-y-1.5">
            <h2 className="text-base font-bold text-teal-950">
              உங்கள் மொழியை தேர்வு செய்யுங்கள்
            </h2>
            <p className="text-xs font-semibold text-teal-800">
              अपनी भाषा चुनें • तुमची भाषा निवडा
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Choose your preferred language
            </p>
          </div>

          {/* 4 Large Language Option Buttons */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleLanguagePick('ta')}
              className="w-full p-4 rounded-2xl bg-white hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-500 text-left transition-all flex items-center justify-between group active:scale-98 cursor-pointer shadow-xs"
            >
              <div>
                <span className="text-lg font-bold text-slate-900 group-hover:text-teal-900 block">
                  தமிழ்
                </span>
                <span className="text-xs text-slate-500">Tamil</span>
              </div>
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguagePick('hi')}
              className="w-full p-4 rounded-2xl bg-white hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-500 text-left transition-all flex items-center justify-between group active:scale-98 cursor-pointer shadow-xs"
            >
              <div>
                <span className="text-lg font-bold text-slate-900 group-hover:text-teal-900 block">
                  हिंदी
                </span>
                <span className="text-xs text-slate-500">Hindi</span>
              </div>
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguagePick('mr')}
              className="w-full p-4 rounded-2xl bg-white hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-500 text-left transition-all flex items-center justify-between group active:scale-98 cursor-pointer shadow-xs"
            >
              <div>
                <span className="text-lg font-bold text-slate-900 group-hover:text-teal-900 block">
                  मराठी
                </span>
                <span className="text-xs text-slate-500">Marathi</span>
              </div>
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleLanguagePick('en')}
              className="w-full p-4 rounded-2xl bg-white hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-500 text-left transition-all flex items-center justify-between group active:scale-98 cursor-pointer shadow-xs"
            >
              <div>
                <span className="text-lg font-bold text-slate-900 group-hover:text-teal-900 block">
                  English
                </span>
                <span className="text-xs text-slate-500">English</span>
              </div>
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
                →
              </span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // SCREEN 2: VOICE-FIRST PATIENT HOME
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between pb-24">
      {/* Top Header: Simple & Non-technical */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-base shadow-xs">
              A
            </span>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-tight">AarogNex</h1>
              <p className="text-[11px] text-teal-700 font-medium leading-none">
                {t('assistant_subtitle') || 'Your Healthcare Assistant'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector compact={true} />
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Logout"
              title={t('logout') || 'Logout'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto w-full px-4 pt-6 flex-1 flex flex-col items-center justify-start space-y-6 text-center">
        
        {/* Core Greeting Question */}
        <div className="space-y-1.5 pt-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug px-2">
            {t('how_can_i_help_today') || 'How can I help you today?'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            {t('speak_health_problem') || 'Speak your health problem'}
          </p>
        </div>

        {/* CONFIRMATION SAFETY GATE (Appears when intent is detected) */}
        {pendingResponse && (
          <div className="w-full bg-white p-5 rounded-3xl shadow-xl border-2 border-teal-500 text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-base border-b border-slate-100 pb-2.5">
              <CheckCircle2 className="text-teal-600 shrink-0" size={22} />
              <span>{t('confirm_prompt_title') || 'Is this correct?'}</span>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed font-medium bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100">
              &ldquo;{pendingResponse.response_text}&rdquo;
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmYes}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer text-sm"
              >
                <span>{t('yes_continue') || '✓ Yes, Continue'}</span>
              </button>
              <button
                type="button"
                onClick={handleRejectNo}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer text-sm"
              >
                <span>{t('no_speak_again') || '✕ No, Speak Again'}</span>
              </button>
            </div>
          </div>
        )}

        {/* CLARIFICATION WARNING (Appears for greetings like "Hi" or non-medical input) */}
        {clarificationWarning && !pendingResponse && (
          <div className="w-full bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl text-left flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
              {clarificationWarning}
            </p>
          </div>
        )}

        {/* VOICE INPUT HERO AREA */}
        {!pendingResponse && (
          <div className="flex flex-col items-center justify-center py-4 w-full space-y-4">
            {/* Giant Microphone Button */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking || isProcessing}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all shadow-xl cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse ring-8 ring-red-100 scale-105'
                  : isSpeaking || isProcessing
                  ? 'bg-teal-300 text-white cursor-wait'
                  : 'bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white ring-8 ring-teal-50 active:scale-95'
              }`}
              aria-label="Microphone"
            >
              {isListening ? <Mic size={54} /> : <MicOff size={54} />}
            </button>

            {/* Speaking / Listening Status Text */}
            <p className="text-base font-bold text-slate-700 min-h-[1.5rem]">
              {isListening
                ? t('listening') || 'Listening...'
                : isSpeaking
                ? t('speaking') || 'Speaking...'
                : isProcessing
                ? '...'
                : t('tap_and_speak') || 'Tap and Speak'}
            </p>

            {/* Live Transcript Display */}
            {transcript && (
              <div className="w-full bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 animate-in fade-in">
                <p className="text-slate-800 text-sm italic font-medium">
                  &ldquo;{transcript}&rdquo;
                </p>
              </div>
            )}

            {/* Toggle Type Instead */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowTypeInput(!showTypeInput)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                <Keyboard size={14} />
                <span>
                  {showTypeInput ? t('voice_instead') || 'Speak instead' : t('type_instead') || 'Type instead'}
                </span>
              </button>
            </div>

            {/* Optional Text Input for Users in noisy areas */}
            {showTypeInput && (
              <div className="w-full flex gap-2 pt-2 animate-in fade-in">
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedText.trim()) {
                      handleProcessInput(typedText);
                      setTypedText('');
                    }
                  }}
                  placeholder={t('type_your_request') || 'Type your health problem here...'}
                  className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-teal-600 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (typedText.trim()) {
                      handleProcessInput(typedText);
                      setTypedText('');
                    }
                  }}
                  disabled={!typedText.trim() || isProcessing}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 rounded-xl flex items-center justify-center cursor-pointer shadow-sm transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TWO SIMPLE PRIMARY ACTION CARDS */}
        <div className="w-full grid grid-cols-1 gap-3 pt-2">
          {/* Emergency Card */}
          <Link href="/emergency" className="block w-full">
            <div className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border-2 border-rose-200 flex items-center justify-between shadow-xs transition-all active:scale-98 group">
              <div className="flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-rose-900 group-hover:text-rose-950">
                    {t('emergency_help') || '🚑 Emergency Help'}
                  </h3>
                  <p className="text-[11px] text-rose-700/90 font-medium">
                    {t('accident') || 'Accident'} / {t('critical') || 'Critical emergency'}
                  </p>
                </div>
              </div>
              <span className="text-rose-600 font-bold text-sm">→</span>
            </div>
          </Link>

          {/* Normal Healthcare Card */}
          <Link href="/normal" className="block w-full">
            <div className="p-4 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border-2 border-teal-200 flex items-center justify-between shadow-xs transition-all active:scale-98 group">
              <div className="flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-teal-900 group-hover:text-teal-950">
                    {t('normal_healthcare') || '🏥 Normal Healthcare'}
                  </h3>
                  <p className="text-[11px] text-teal-700/90 font-medium">
                    {t('doctor_consultation') || 'Doctor consultation'} & clinics
                  </p>
                </div>
              </div>
              <span className="text-teal-600 font-bold text-sm">→</span>
            </div>
          </Link>
        </div>
      </main>

      {/* Patient Bottom Navigation: Home | My Records | My Details */}
      <PatientNavigation />
    </div>
  );
}
