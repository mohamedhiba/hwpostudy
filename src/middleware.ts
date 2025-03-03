import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Check if the request is for an API route
  if (pathname.startsWith('/api/')) {
    // Handle authentication routes specially
    if (pathname.startsWith('/api/auth/')) {
      // If it's an error path, redirect to the auth page with error param
      if (pathname.includes('/error')) {
        // Extract error code if present in the URL
        const url = new URL(request.url);
        const errorCode = url.searchParams.get('error') || 'default';
        const redirectUrl = new URL('/auth', request.url);
        redirectUrl.searchParams.set('error', errorCode);
        return NextResponse.redirect(redirectUrl);
      }
      
      // Let session API calls continue but handle other auth paths
      if (pathname === '/api/auth/session') {
        return NextResponse.next();
      }
      
      // For signin/signout in static exports, redirect to the auth page
      if (pathname.includes('/signin') || pathname.includes('/signout') || pathname.includes('/callback')) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
      
      // For other auth API calls, let them pass through
      return NextResponse.next();
    }

    // Check for guest mode flag
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

// Run middleware on API routes and auth routes
export const config = {
  matcher: [
    '/api/:path*',
    '/api/auth/:path*'
  ],
}; 