"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PatientNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isHome = pathname === '/' || pathname === '/patient-home';
  const isRecords = pathname.startsWith('/records');
  const isDetails = pathname.startsWith('/my-details') || pathname.startsWith('/patient-dashboard');

  return (
    <nav 
      aria-label="Patient Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg px-2 py-1.5"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
        {/* Home */}
        <Link
          href="/patient-home"
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            isHome 
              ? 'text-teal-700 bg-teal-50/80 font-bold' 
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight tracking-tight">
            {t('home_nav') || 'Home'}
          </span>
        </Link>

        {/* My Records */}
        <Link
          href="/records"
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            isRecords 
              ? 'text-teal-700 bg-teal-50/80 font-bold' 
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <FileText className={`w-5 h-5 mb-0.5 ${isRecords ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight tracking-tight">
            {t('records_nav') || 'My Records'}
          </span>
        </Link>

        {/* My Details */}
        <Link
          href="/my-details"
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            isDetails 
              ? 'text-teal-700 bg-teal-50/80 font-bold' 
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <User className={`w-5 h-5 mb-0.5 ${isDetails ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight tracking-tight">
            {t('details_nav') || 'My Details'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
