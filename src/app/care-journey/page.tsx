import { Suspense } from 'react';
import CareJourneyClient from './CareJourneyClient';

export const dynamic = 'force-dynamic';

export default function CareJourneyPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Loading care journey...</h2>
      </div>
    }>
      <CareJourneyClient />
    </Suspense>
  );
}