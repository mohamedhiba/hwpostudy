import { NextResponse, NextRequest } from 'next/server';

// Check if we're in static export mode
const isStaticExport = process.env.NEXT_EXPORT === 'true' || process.env.NODE_ENV === 'production';

export async function middleware(request: NextRequest) {
  // Skip middleware in static export mode
  if (isStaticExport) {
    const { pathname } = request.nextUrl;
    
    // Handle auth error routes with highest priority
    if (pathname.startsWith('/api/auth/error')) {
      // Extract error code if present
      const url = new URL(request.url);
      const errorCode = url.searchParams.get('error') || 'default';
      
      // Redirect to auth page with error
      return NextResponse.redirect(new URL(`/auth?error=${errorCode}`, request.url));
    }
    
    // Handle auth signin/signout/callback routes
    if (
      pathname.startsWith('/api/auth/signin') ||
      pathname.startsWith('/api/auth/signout') ||
      pathname.startsWith('/api/auth/callback')
    ) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    
    // Allow session API calls to continue (they'll be handled by Firebase rewrites)
    if (pathname.startsWith('/api/auth/session')) {
      return NextResponse.next();
    }
    
    // For other API routes in static export, return a mock response
    if (pathname.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({
          error: 'API routes are not available in static export mode',
          message: 'Please use the development server for API functionality'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
  
  // For non-static or non-API routes, continue normal request handling
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/api/auth/error/:path*', 
    '/api/auth/signin/:path*', 
    '/api/auth/signout/:path*', 
    '/api/auth/callback/:path*',
    '/api/:path*'
  ],
}; 