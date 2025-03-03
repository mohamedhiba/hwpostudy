import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Check if the request is for an API route
  if (pathname.startsWith('/api/')) {
    // For static export we redirect all API calls to our live API server
    const url = new URL(pathname, 'https://hwpostudy.web.app');
    return NextResponse.redirect(url);
  }

  // Otherwise continue with the request
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
}; 