import { getSessionUser } from '@/actions/auth';
import { redirect } from 'next/navigation';
import PatientHomeClient from './PatientHomeClient';

export const dynamic = 'force-dynamic';

export default async function PatientHomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Role safety: Only patients and helpers land here
  if (user.role === 'HOSPITAL_STAFF') {
    redirect('/hospital-dashboard');
  } else if (user.role === 'GOVERNMENT_HEALTH_AUTHORITY') {
    redirect('/government-dashboard');
  } else if (user.role === 'PLATFORM_ADMIN') {
    redirect('/admin-dashboard');
  }

  return <PatientHomeClient user={user} />;
}
