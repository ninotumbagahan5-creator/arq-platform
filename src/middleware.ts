import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define protected paths
  const isProtectedPath = path.startsWith('/maker') || 
                          path.startsWith('/facilitator') || 
                          path.startsWith('/student') ||
                          path.startsWith('/admin');

  if (isProtectedPath) {
    const sessionCookie = request.cookies.get('session');
    let sessionData = null;

    if (sessionCookie) {
      try {
        sessionData = await decrypt(sessionCookie.value);
      } catch (e) {
        // invalid token
      }
    }

    if (!sessionData) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = sessionData.user.role;

    // RBAC Enforcement based on ARQ Spec
    if (path.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (path.startsWith('/maker') && !['MAKER', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // Facilitators and Admins can access facilitator portal
    if (path.startsWith('/facilitator') && !['FACILITATOR', 'ADMIN', 'MAKER'].includes(role)) {
       return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Students can access student portal. Facilitators and Makers might want to preview it, but strictly it's for STUDENTS.
    if (path.startsWith('/student') && !['STUDENT', 'ADMIN', 'MAKER', 'FACILITATOR'].includes(role)) {
       return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/maker/:path*',
    '/facilitator/:path*',
    '/student/:path*',
    '/admin/:path*'
  ],
};
