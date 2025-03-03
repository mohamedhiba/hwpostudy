import { NextResponse, NextRequest } from 'next/server';

// Check if we're in a static export environment
const isStaticExport = process.env.NEXT_EXPORT === 'true' || process.env.NODE_ENV === 'production';

export async function middleware(request: NextRequest) {
  // In static export mode, we need special handling
  const { pathname } = request.nextUrl;

  // Skip middleware entirely in static export mode
  if (isStaticExport) {
    return NextResponse.next();
  }

  // Skip non-API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Special handling for auth routes
  if (pathname.startsWith('/api/auth/')) {
    // Handle specific auth paths
    if (pathname.includes('/error')) {
      // Redirect auth errors to the auth page with error parameter
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('error', 'default');
      return NextResponse.redirect(url);
    }

    // Let session API calls pass through - they'll be handled by our useAuth hook
    if (pathname.includes('/session')) {
      return NextResponse.next();
    }

    // Handle signin/signout redirects
    if (pathname.includes('/signin') || pathname.includes('/signout')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      return NextResponse.redirect(url);
    }
    
    // For other auth API routes - we let them pass
    return NextResponse.next();
  }

  // Handle all other API routes (only in development, as we're returning early in static export)
  // Default mock API response
  return NextResponse.json({
    message: "API calls are not available in static exports. Please use guest mode or run the development server for API functionality.",
    success: false
  });
}

// Fixed matcher configuration without conditional expressions
export const config = {
  matcher: ['/api/:path*'],
}; 