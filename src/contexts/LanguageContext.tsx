"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import mrTranslations from '../locales/mr.json';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import taTranslations from '../locales/ta.json';

type LocaleType = 'mr' | 'en' | 'hi' | 'ta';

type Translations = Record<string, string>;

interface LanguageContextProps {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => void;
  t: (key: string) => string;
  hasSelectedLanguage: boolean;
  confirmLanguage: (locale: LocaleType) => void;
}

const translations: Record<LocaleType, Translations> = {
  mr: mrTranslations,
  en: enTranslations,
  hi: hiTranslations,
  ta: taTranslations
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<LocaleType>('en'); // Start with English by default
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('aarognex_locale') as LocaleType;
      const savedSelected = localStorage.getItem('aarognex_lang_selected');
      if (savedLocale && ['en', 'hi', 'mr', 'ta'].includes(savedLocale)) {
        setLocale(savedLocale);
      }
      if (savedSelected === 'true') {
        setHasSelectedLanguage(true);
      }
    } catch (e) {
      // LocalStorage not available or blocked
    }
  }, []);

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations['en'][key] || key;
  };

  const confirmLanguage = (newLocale: LocaleType) => {
    setLocale(newLocale);
    setHasSelectedLanguage(true);
    try {
      localStorage.setItem('aarognex_locale', newLocale);
      localStorage.setItem('aarognex_lang_selected', 'true');
    } catch (e) {}
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, hasSelectedLanguage, confirmLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
