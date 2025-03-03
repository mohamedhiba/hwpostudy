export const dynamic = "force-static";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Required for static generation with dynamic routes
export function generateStaticParams() {
  return [{ friendshipId: 'placeholder' }];
}

export async function DELETE(
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

    // Get the friendship
    const friendship = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Check if user is part of this friendship
    const userId = auth.userId;
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this friendship' }, { status: 403 });
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: {
        id: friendshipId,
      },
    });

    return NextResponse.json({ message: 'Friendship deleted successfully' });
  } catch (error) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json({ error: 'An error occurred while deleting the friendship' }, { status: 500 });
  }
} 