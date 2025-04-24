import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Rate limiting implementation (simple in-memory store)
const attempts = new Map<string, { count: number, lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 1000; // 30 seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;
    
    // Get IP for rate limiting (or a cookie-based identifier could be used)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check if IP is locked out
    const attemptData = attempts.get(ip);
    if (attemptData && attemptData.lockUntil > Date.now()) {
      const remainingSeconds = Math.ceil((attemptData.lockUntil - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, message: `Too many attempts. Try again in ${remainingSeconds} seconds.` },
        { status: 429 }
      );
    }
    
    // This should be an environment variable without NEXT_PUBLIC_
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    if (!correctPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Authentication system misconfigured' },
        { status: 500 }
      );
    }
    
    if (password === correctPassword) {
      // Reset attempts on successful login
      if (attemptData) {
        attempts.set(ip, { count: 0, lockUntil: 0 });
      }
      
      // Create response with success message
      const response = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );
      
      // Set auth cookie (httpOnly for security, secure in production)
      response.cookies.set('auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
      
      return response;
    } else {
      // Increment failed attempts
      let newAttemptData = attemptData || { count: 0, lockUntil: 0 };
      newAttemptData.count += 1;
      
      // Lock account if max attempts reached
      if (newAttemptData.count >= MAX_ATTEMPTS) {
        newAttemptData.lockUntil = Date.now() + LOCK_DURATION;
      }
      
      attempts.set(ip, newAttemptData);
      
      const attemptsLeft = MAX_ATTEMPTS - newAttemptData.count;
      return NextResponse.json(
        { 
          success: false, 
          message: attemptsLeft > 0 
            ? `Invalid password. ${attemptsLeft} attempts remaining.` 
            : 'Too many failed attempts. Account locked.'
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    );
  }
} 