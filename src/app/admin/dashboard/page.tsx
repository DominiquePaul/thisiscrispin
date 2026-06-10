import { isAuthenticatedServer } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const authed = await isAuthenticatedServer();
  if (!authed) redirect('/');
  return <DashboardClient />;
}
