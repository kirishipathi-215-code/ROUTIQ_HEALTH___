import { getSessionUser } from '@/actions/auth';
import { redirect } from 'next/navigation';
import HomePageClient from './HomePageClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect('/login');
  }

  // Role-based automatic dispatch for staff, government authority, and superadmins
  if (user.role === 'HOSPITAL_STAFF') {
    redirect('/hospital-dashboard');
  } else if (user.role === 'GOVERNMENT_HEALTH_AUTHORITY') {
    redirect('/government-dashboard');
  } else if (user.role === 'PLATFORM_ADMIN') {
    redirect('/admin-dashboard');
  }

  redirect('/patient-home');
}
