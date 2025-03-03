export const dynamic = "error";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Mock data for static export
const STATIC_FRIENDS = [
  { id: 'friend1', name: 'Jamie', email: 'jamie@example.com', image: null, status: 'ACCEPTED', isRequester: false },
  { id: 'friend2', name: 'Riley', email: 'riley@example.com', image: null, status: 'PENDING', isRequester: true }
];

export async function GET(request: Request) {
  try {
    // For static export, return mock data
    if (process.env.NEXT_EXPORT === 'true') {
      return NextResponse.json(STATIC_FRIENDS);
    }
    
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return new NextResponse("Missing userId", { status: 400 });
    }
    
    // Ensure the user is accessing their own data
    if (userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Get all friendships where user is involved
    const sentRequests = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
      },
      include: {
        addressee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    const receivedRequests = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    // Format the results
    const sent = sentRequests.map((fr: any) => ({
      id: fr.id,
      name: fr.addressee.name,
      email: fr.addressee.email,
      image: fr.addressee.image,
      status: fr.status,
      isRequester: true,
    }));
    
    const received = receivedRequests.map((fr: any) => ({
      id: fr.id,
      name: fr.requester.name,
      email: fr.requester.email,
      image: fr.requester.image,
      status: fr.status,
      isRequester: false,
    }));
    
    // Combine and return results
    const friends = [...sent, ...received];
    
    return NextResponse.json(friends);
  } catch (error) {
    console.error("[FRIENDS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 