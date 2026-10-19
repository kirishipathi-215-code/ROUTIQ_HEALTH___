"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useVoice } from '../hooks/useVoice';
import { getAIService, AIResponse } from '../services/AIService';
import { Mic, MicOff, AlertCircle, Send, CheckCircle2, XCircle, HelpCircle, Activity, Stethoscope } from 'lucide-react';

export type AssistantState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'PROCESSING' 
  | 'NEEDS_CLARIFICATION' 
  | 'NEEDS_CONFIRMATION' 
  | 'CONFIRMED' 
  | 'MATCHING';

interface VoiceAssistantProps {
  onAIResponse: (data: AIResponse) => void;
  mode?: 'NORMAL' | 'EMERGENCY';
}

export default function VoiceAssistant({ onAIResponse, mode = 'NORMAL' }: VoiceAssistantProps) {
  const { t, setLocale, locale } = useLanguage();
  const { isListening, isSpeaking, transcript, error, startListening, stopListening, speak } = useVoice();
  const [hasStarted, setHasStarted] = useState(false);
  const [manualText, setManualText] = useState('');
  
  // State Machine
  const [assistantState, setAssistantState] = useState<AssistantState>('IDLE');
  const [pendingResponse, setPendingResponse] = useState<AIResponse | null>(null);
  const [clarificationMessage, setClarificationMessage] = useState<string>('');

  // Initial welcome
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      speak(t('welcome'));
    }
  }, [hasStarted, speak, t]);

  // Handle voice transcript finish
  useEffect(() => {
    if (!isListening && transcript && assistantState !== 'NEEDS_CONFIRMATION') {
      processInput(transcript);
    }
  }, [isListening, transcript]);

  // Sync listening state
  useEffect(() => {
    if (isListening) {
      setAssistantState('LISTENING');
    } else if (assistantState === 'LISTENING') {
      setAssistantState('IDLE');
    }
  }, [isListening]);

  const processInput = async (text: string) => {
    if (!text.trim()) return;

    setAssistantState('PROCESSING');
    try {
      const ai = getAIService();
      const response = await ai.processInput(text, mode);

      // Auto-switch language based on AI detection if detected
      if (response.response_language && ['en', 'mr', 'hi', 'ta'].includes(response.response_language)) {
        setLocale(response.response_language as 'en' | 'mr' | 'hi' | 'ta');
      }

      // 1. Irrelevant or Insufficient Input -> Clarification Gate
      if (!response.is_healthcare_related || response.requires_clarification) {
        setAssistantState('NEEDS_CLARIFICATION');
        setClarificationMessage(response.response_text);
        setPendingResponse(null);
        speak(response.response_text, response.response_language);
        return;
      }

      // 2. Healthcare intent detected -> Confirmation Gate
      if (response.requires_confirmation) {
        setAssistantState('NEEDS_CONFIRMATION');
        setPendingResponse(response);
        setClarificationMessage('');
        speak(response.response_text, response.response_language);
        return;
      }

      // 3. Directly confirmed (if applicable)
      setAssistantState('CONFIRMED');
      onAIResponse(response);
    } catch (err) {
      console.error('[AI Assistant Error]', err);
      setAssistantState('IDLE');
      speak(t('error_understanding'));
    }
  };

  const handleManualSubmit = () => {
    if (manualText.trim()) {
      processInput(manualText);
      setManualText('');
    }
  };

  const handleConfirm = () => {
    if (!pendingResponse) return;

    setAssistantState('CONFIRMED');
    
    // Spoken acknowledgment
    const spokenFeedback = t('finding_suitable_care') || "Finding suitable healthcare for you...";
    speak(spokenFeedback, pendingResponse.response_language || locale);

    // Call hospital matching via callback
    onAIResponse(pendingResponse);
  };

  const handleReject = () => {
    setAssistantState('IDLE');
    setPendingResponse(null);
    setClarificationMessage('');
    
    const promptAgain = locale === 'hi' 
      ? 'कृपया दोबारा बताएं कि आपको क्या स्वास्थ्य सहायता चाहिए।'
      : locale === 'mr'
      ? 'कृपया पुन्हा सांगा की तुम्हाला कोणती आरोग्य मदत हवी आहे.'
      : locale === 'ta'
      ? 'Dhayavuseithu ungalukku enna udhavai thevai endru meendum sollungal.'
      : 'Please tell me again what healthcare help you need.';

    speak(promptAgain, locale);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-3xl border border-blue-100 shadow-md w-full">
      <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">{t('how_can_i_help')}</h2>

      {/* STATE 1: CONFIRMATION GATE */}
      {assistantState === 'NEEDS_CONFIRMATION' && pendingResponse && (
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md border-2 border-blue-200 animate-in fade-in zoom-in mb-4">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-lg mb-4 border-b pb-2">
            <CheckCircle2 className="text-blue-600" size={24} />
            <span>{t('confirm_prompt_title') || "Is this correct?"}</span>
          </div>

          <div className="space-y-3 bg-blue-50/60 p-4 rounded-xl mb-5 text-left border border-blue-100">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                {t('health_concern') || "Health Concern"}
              </span>
              <span className="text-base font-bold text-gray-800 flex items-center gap-1.5 mt-0.5">
                <Activity size={16} className="text-red-500" />
                {(pendingResponse.healthcare_need || pendingResponse.incident_type || 'General Consultation').replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                {t('suggested_service') || "Suggested Service"}
              </span>
              <span className="text-base font-semibold text-gray-700 flex items-center gap-1.5 mt-0.5">
                <Stethoscope size={16} className="text-blue-600" />
                {(pendingResponse.service_category || 'Primary Care Evaluation').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-700 italic text-center mb-6 px-2 bg-gray-50 py-2 rounded-lg border">
            "{pendingResponse.response_text}"
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CheckCircle2 size={20} />
              <span>{t('yes_continue') || "✓ Yes, Continue"}</span>
            </button>

            <button
              onClick={handleReject}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-4 rounded-xl border border-gray-300 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <XCircle size={20} className="text-gray-500" />
              <span>{t('no_speak_again') || "✕ No, Speak Again"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: CLARIFICATION NEEDED / IRRELEVANT INPUT */}
      {assistantState === 'NEEDS_CLARIFICATION' && (
        <div className="w-full max-w-md bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl mb-6 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <HelpCircle className="text-amber-600 shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-1">Healthcare Information Needed</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                {clarificationMessage || t('clarification_needed')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mic Button Area (Always accessible when not confirming) */}
      {assistantState !== 'NEEDS_CONFIRMATION' && (
        <>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking || assistantState === 'PROCESSING'}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-xl mb-4 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white ring-4 ring-red-200' 
                : isSpeaking || assistantState === 'PROCESSING'
                ? 'bg-blue-300 text-white cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 text-white ring-4 ring-blue-100 active:scale-95'
            }`}
          >
            {isListening ? <Mic size={48} /> : <MicOff size={48} />}
          </button>

          <p className="text-lg font-medium text-gray-700">
            {isListening 
              ? t('listening') 
              : assistantState === 'PROCESSING'
              ? 'Analyzing input...'
              : isSpeaking 
              ? t('speaking') 
              : t('tap_and_speak')}
          </p>

          {transcript && (
            <div className="mt-4 p-3 bg-white rounded-xl shadow-sm w-full max-w-md border border-gray-100 text-center animate-in fade-in zoom-in">
              <p className="text-gray-800 text-base font-medium">"{transcript}"</p>
            </div>
          )}

          <div className="mt-6 w-full max-w-md flex gap-2">
            <input 
              type="text" 
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              disabled={assistantState === 'PROCESSING'}
              className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              placeholder={t('type_your_request') || "Type your request (e.g. fever and headache)..."}
            />
            <button 
              onClick={handleManualSubmit}
              disabled={!manualText.trim() || assistantState === 'PROCESSING'}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="mt-4 w-full">
          <div className="flex items-center justify-center gap-2 text-red-500">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}