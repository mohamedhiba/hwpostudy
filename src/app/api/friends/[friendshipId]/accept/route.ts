import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

export async function POST(
  request: Request,
  { params }: { params: { friendshipId: string } }
) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { friendshipId } = params;
    const { userId } = await request.json();
    
    if (!userId) {
      return new NextResponse("Missing userId", { status: 400 });
    }
    
    // Ensure the user is using their own ID
    if (userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Get the friendship
    const friendship = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
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
    
    if (!friendship) {
      return new NextResponse("Friendship not found", { status: 404 });
    }
    
    // Check if the user is the addressee
    if (friendship.addresseeId !== userId) {
      return new NextResponse("Only the addressee can accept a friend request", { status: 403 });
    }
    
    // Check if the friendship is already accepted
    if (friendship.status !== "PENDING") {
      return new NextResponse(`Friendship is already ${friendship.status.toLowerCase()}`, { status: 400 });
    }
    
    // Update the friendship status
    const updatedFriendship = await prisma.friendship.update({
      where: {
        id: friendshipId,
      },
      data: {
        status: "ACCEPTED",
      },
    });
    
    // Format response
    const formattedFriendship = {
      id: updatedFriendship.id,
      name: friendship.requester.name,
      email: friendship.requester.email,
      image: friendship.requester.image,
      status: updatedFriendship.status,
      isRequester: false,
    };
    
    return NextResponse.json(formattedFriendship);
  } catch (error) {
    console.error("[FRIEND_ACCEPT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 