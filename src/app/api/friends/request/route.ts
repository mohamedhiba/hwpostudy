import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Define an interface for the user with ID
interface UserWithId {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export async function POST(request: Request) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { requesterId, addresseeId } = await request.json();
    
    if (!requesterId || !addresseeId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Ensure the user is using their own ID
    if (requesterId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Check if users exist
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    
    const addressee = await prisma.user.findUnique({
      where: { id: addresseeId },
    });
    
    if (!requester || !addressee) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Check if a friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });
    
    if (existingFriendship) {
      return new NextResponse("Friendship already exists", { status: 409 });
    }
    
    try {
      // Create a new friendship
      const friendship = await prisma.friendship.create({
        data: {
          requesterId,
          addresseeId,
          status: "PENDING",
        },
        include: {
          addressee: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
      
      // Format response
      const formattedFriendship = {
        id: friendship.id,
        name: friendship.addressee.name,
        email: friendship.addressee.email,
        image: friendship.addressee.image,
        status: friendship.status,
        isRequester: true,
      };
      
      return NextResponse.json(formattedFriendship);
    } catch (error: any) {
      // Handle specific database errors
      if (error.code === 'P2002') {
        return new NextResponse("You've already sent a friend request to this user", { status: 409 });
      }
      throw error; // Re-throw for the outer catch block to handle
    }
  } catch (error) {
    console.error("[FRIEND_REQUEST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 