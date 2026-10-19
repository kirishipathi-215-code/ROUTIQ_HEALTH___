"use client";

import VoiceAssistant from '@/components/VoiceAssistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NormalClient() {
  const { t } = useLanguage();

  const handleAIResponse = (data: any) => {
    window.location.href = `/match?data=${encodeURIComponent(JSON.stringify(data))}&confirmed=true`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/patient-home">
          <ArrowLeft className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{t('normal_care')}</h1>
      </header>

      <VoiceAssistant onAIResponse={handleAIResponse} />
    </div>
  );
}
