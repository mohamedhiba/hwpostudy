import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { Session } from "next-auth";

// Type definition for user with ID
export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  totalStudyTime: number;
  totalTasksDone: number;
}

// Extended session type with proper user typing
export interface ExtendedSession extends Omit<Session, 'user'> {
  user: ExtendedUser;
}

// Helper function to get an authenticated session
export async function getAuthSession() {
  // Fix TypeScript errors by using type assertion
  return await getServerSession(authOptions as any) as ExtendedSession | null;
}

// Helper function to check authentication and return the user ID
export async function getAuthUserId() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

// Helper function to verify authentication in API routes
export async function verifyAuth() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { authenticated: false, userId: null, response: new NextResponse("Unauthorized", { status: 401 }) };
  }
  
  return { authenticated: true, userId: session.user.id, response: null };
} 