import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Check if the request is for an API route
  if (pathname.startsWith('/api/')) {
    // For static export, return a mock response for API routes
    return new NextResponse(
      JSON.stringify({ 
        message: 'API calls are not available in static exports. Please use the development server for API functionality.' 
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