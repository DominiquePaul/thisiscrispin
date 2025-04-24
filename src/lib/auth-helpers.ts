import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Check if a user is authenticated based on their session cookie
 */
export function isAuthenticated(req: NextRequest): boolean {
  // In a real app, you would verify a JWT or session token
  // For now, we're using a simple auth cookie that we set when admin logs in
  
  const authCookie = req.cookies.get('auth');
  return authCookie?.value === 'true';
}

/**
 * Check if the request is authenticated from server components
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  return authCookie?.value === 'true';
} 