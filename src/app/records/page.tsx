import prisma from '@/lib/prisma';
import { getSessionUser } from '@/actions/auth';
import RecordsClient from './RecordsClient';

export const dynamic = 'force-dynamic';

export default async function RecordsPage() {
  const user = await getSessionUser();
  
  if (!user) {
    return <div>Please log in to view records.</div>;
  }

  // Fetch Emergency Events
  const emergencyEvents = await prisma.emergencyEvent.findMany({
    where: { userId: user.id },
    include: { facility: true },
    orderBy: { startTime: 'desc' }
  });

  // Fetch Normal Care Journeys
  const careJourneys = await prisma.careJourney.findMany({
    where: { userId: user.id, type: 'NORMAL' },
    include: { 
      facility: true,
      steps: true,
      doctorAdvice: true 
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <RecordsClient 
      user={user} 
      emergencyEvents={emergencyEvents} 
      careJourneys={careJourneys} 
    />
  );
}


