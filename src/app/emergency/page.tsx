import { Suspense } from 'react';
import EmergencyClient from './EmergencyClient';

export const dynamic = 'force-dynamic';

export default function EmergencyPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-red-800">Loading emergency mode...</h2>
      </div>
    }>
      <EmergencyClient />
    </Suspense>
  );
}