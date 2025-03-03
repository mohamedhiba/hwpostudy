export const dynamic = "error";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Mock data for static export
const STATIC_USERS = [
  { id: 'user1', name: 'Alex Smith', email: 'alex@example.com', image: null },
  { id: 'user2', name: 'Sam Jones', email: 'sam@example.com', image: null },
  { id: 'user3', name: 'Taylor Chen', email: 'taylor@example.com', image: null }
];

export async function GET(request: Request) {
  try {
    // For static export, return mock data
    if (process.env.NEXT_EXPORT === 'true') {
      return NextResponse.json(STATIC_USERS);
    }
    
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term");
    const userId = searchParams.get("userId");
    
    if (!term || !userId) {
      return new NextResponse("Missing search term or userId", { status: 400 });
    }
    
    // Ensure the user is searching using their own userId
    if (userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Get existing friendships to filter out
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    });
    
    // Extract IDs to exclude (user's own ID and existing friends/requests)
    const excludeIds = new Set<string>([userId]);
    friendships.forEach((f: any) => {
      excludeIds.add(f.requesterId);
      excludeIds.add(f.addresseeId);
    });
    
    // Search users by name or email
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: term } },
              { email: { contains: term } },
            ],
          },
          {
            id: {
              notIn: Array.from(excludeIds),
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10,
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("[USER_SEARCH_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 