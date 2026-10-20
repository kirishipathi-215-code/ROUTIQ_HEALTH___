"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useVoice } from '../hooks/useVoice';
import { getAIService } from '../services/AIService';
import { Mic, MicOff, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
  onSelect?: (locale: 'mr' | 'en' | 'hi' | 'ta') => void;
}

export default function LanguageSelector({ compact, onSelect }: LanguageSelectorProps) {
  const { locale, confirmLanguage, hasSelectedLanguage } = useLanguage();
  const { isListening, transcript, startListening, stopListening, speak } = useVoice();
  const [hasStarted, setHasStarted] = useState(false);

  const isCompact = compact === true || (compact !== false && hasSelectedLanguage);

  useEffect(() => {
    if (!isCompact && !hasStarted) {
      setHasStarted(true);
      speak("Which language do you prefer? English, Hindi, Marathi, or Tamil?");
    }
  }, [isCompact, hasStarted, speak]);

  useEffect(() => {
    if (!isCompact && !isListening && transcript) {
      processInput(transcript);
    }
  }, [isCompact, isListening, transcript]);

  const processInput = async (text: string) => {
    try {
      const ai = getAIService();
      const response = await ai.processInput(text, 'LANGUAGE_SELECT');
      
      if (response.language) {
        const chosen = response.language as 'en' | 'mr' | 'hi' | 'ta';
        confirmLanguage(chosen);
        if (onSelect) onSelect(chosen);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (lang: 'en' | 'hi' | 'mr' | 'ta') => {
    confirmLanguage(lang);
    if (onSelect) onSelect(lang);
  };

  // Compact mode for headers & navigation bars
  if (isCompact) {
    return (
      <div className="relative inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 shadow-2xs transition-colors">
        <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <select
          value={locale}
          onChange={(e) => handleSelect(e.target.value as 'en' | 'hi' | 'mr' | 'ta')}
          className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-hidden cursor-pointer pr-1"
          aria-label="Select Language"
        >
          <option value="en">English (EN)</option>
          <option value="hi">हिंदी (HI)</option>
          <option value="mr">मराठी (MR)</option>
          <option value="ta">தமிழ் (TA)</option>
        </select>
      </div>
    );
  }

  // Full onboarding mode
  return (
    <div className="flex flex-col items-center justify-center min-h-[35vh] p-6 bg-blue-50/80 rounded-2xl m-4 border-2 border-blue-100 shadow-md">
      <h2 className="text-2xl font-bold text-blue-900 mb-1 text-center">
        Which language do you prefer?
      </h2>
      <p className="text-sm font-medium text-blue-700 mb-6 text-center">
        English • हिंदी • मराठी • தமிழ்
      </p>

      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-lg cursor-pointer ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' 
            : 'bg-teal-600 hover:bg-teal-700 text-white'
        }`}
        aria-label="Voice input"
      >
        {isListening ? <Mic size={40} /> : <MicOff size={40} />}
      </button>

      <p className="mt-3 text-sm font-medium text-gray-700">
        {isListening ? 'Listening in your language...' : 'Tap and Speak'}
      </p>

      {transcript && (
        <div className="mt-4 p-3 bg-white rounded-lg shadow-2xs w-full max-w-md border border-gray-200">
          <p className="text-gray-800 text-sm text-center italic">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={() => handleSelect('en')}
          className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-900 rounded-xl shadow-xs font-semibold border border-gray-200 hover:border-teal-400 transition-all text-sm cursor-pointer active:scale-95"
        >
          English
        </button>
        <button
          type="button"
          onClick={() => handleSelect('hi')}
          className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-900 rounded-xl shadow-xs font-semibold border border-gray-200 hover:border-teal-400 transition-all text-sm cursor-pointer active:scale-95"
        >
          हिंदी
        </button>
        <button
          type="button"
          onClick={() => handleSelect('mr')}
          className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-900 rounded-xl shadow-xs font-semibold border border-gray-200 hover:border-teal-400 transition-all text-sm cursor-pointer active:scale-95"
        >
          मराठी
        </button>
        <button
          type="button"
          onClick={() => handleSelect('ta')}
          className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-900 rounded-xl shadow-xs font-semibold border border-gray-200 hover:border-teal-400 transition-all text-sm cursor-pointer active:scale-95"
        >
          தமிழ்
        </button>
      </div>
    </div>
  );
}
