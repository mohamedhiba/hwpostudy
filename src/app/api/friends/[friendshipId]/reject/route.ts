export const dynamic = "force-static";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Required for static generation with dynamic routes
export function generateStaticParams() {
  return [{ friendshipId: 'placeholder' }];
}

export async function POST(
  request: Request,
  { params }: { params: { friendshipId: string } }
) {
  try {
    // Authenticate the user
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendshipId } = params;

    // Get the friendship request
    const friendRequest = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
      },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Verify that the logged-in user is the addressee of the request
    if (friendRequest.addresseeId !== auth.userId) {
      return NextResponse.json({ error: 'Not authorized to reject this request' }, { status: 403 });
    }

    // Delete the friend request (rejection)
    await prisma.friendship.delete({
      where: {
        id: friendshipId,
      },
    });

    return NextResponse.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json({ error: 'An error occurred while rejecting the friend request' }, { status: 500 });
  }
} 