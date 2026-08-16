import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const sessionData = await decrypt(sessionCookie.value);
    return NextResponse.json({ user: sessionData.user });
  } catch (error) {
    // Invalid or expired token
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
