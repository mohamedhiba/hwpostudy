import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Check if the request is for an API route
  if (pathname.startsWith('/api/')) {
    // Don't intercept authentication routes
    if (pathname.startsWith('/api/auth/') || pathname.includes('auth')) {
      return NextResponse.next();
    }

    // Check for guest mode flag (could be in session cookie or header)
    const isGuestCookie = request.cookies.get('isGuest')?.value;
    const isGuestHeader = request.headers.get('x-guest-mode');
    const isGuest = isGuestCookie === 'true' || isGuestHeader === 'true';

    if (isGuest) {
      // Return a special response indicating guest mode
      return new NextResponse(
        JSON.stringify({ 
          message: 'Using guest mode. Data is saved locally only.',
          isGuest: true
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For static export, return a mock response for other API routes
    return new NextResponse(
      JSON.stringify({ 
        message: 'API calls are not available in static exports. Please use the development server for API functionality.',
        suggestGuestMode: true
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Otherwise continue with the request
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
}; 