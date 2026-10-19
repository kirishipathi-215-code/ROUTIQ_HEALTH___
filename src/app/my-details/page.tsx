import { getSessionUser } from '@/actions/auth';
import { redirect } from 'next/navigation';
import MyDetailsClient from './MyDetailsClient';

export const dynamic = 'force-dynamic';

export default async function MyDetailsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Hospital staff, government, admin have their own dashboards
  if (user.role === 'HOSPITAL_STAFF') {
    redirect('/hospital-dashboard');
  } else if (user.role === 'GOVERNMENT_HEALTH_AUTHORITY') {
    redirect('/government-dashboard');
  } else if (user.role === 'PLATFORM_ADMIN') {
    redirect('/admin-dashboard');
  }

  return <MyDetailsClient user={user} />;
}
