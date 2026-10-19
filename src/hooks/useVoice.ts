"use client";

import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const useVoice = () => {
  const { locale } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  let recognition: any = null;

  if (typeof window !== 'undefined') {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
    }
  }

  useEffect(() => {
    if (recognition) {
      const getLangCode = (loc: string) => {
        if (loc === 'mr') return 'mr-IN';
        if (loc === 'hi') return 'hi-IN';
        if (loc === 'ta') return 'ta-IN';
        return 'en-IN';
      };
      recognition.lang = getLangCode(locale);
    }
  }, [locale]);

  const startListening = useCallback(async () => {
    if (!recognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setError('Microphone unavailable or permission denied.');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setError('Could not start microphone.');
      setIsListening(false);
    }
  }, [locale]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text: string, customLocale?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language for TTS
    const targetLoc = customLocale || locale;
    if (targetLoc === 'mr') utterance.lang = 'mr-IN';
    else if (targetLoc === 'hi') utterance.lang = 'hi-IN';
    else if (targetLoc === 'ta') utterance.lang = 'ta-IN';
    else utterance.lang = 'en-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [locale]);

  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak
  };
};
