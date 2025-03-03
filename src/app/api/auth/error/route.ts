export const dynamic = "error";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Get the URL and parse the error code
  const url = new URL(request.url);
  const errorCode = url.searchParams.get('error') || 'default';
  
  // In a static export environment, redirect to /auth with the error code
  if (process.env.NEXT_EXPORT === 'true' || process.env.NODE_ENV === 'production') {
    // Create a redirect Response
    return NextResponse.redirect(new URL(`/auth?error=${errorCode}`, url.origin));
  }
  
  // In normal environment, redirect to /auth with the error code
  return NextResponse.redirect(new URL(`/auth?error=${errorCode}`, url.origin));
}

// Handle POST requests to /api/auth/error
export async function POST(request: Request) {
  // Just call the GET function as we handle both the same way
  return GET(request);
} 