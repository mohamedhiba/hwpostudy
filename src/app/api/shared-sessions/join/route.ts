import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated || !auth.userId) {
      return auth.response;
    }
    
    const { inviteCode } = await request.json();
    
    if (!inviteCode) {
      return new NextResponse("Invite code is required", { status: 400 });
    }
    
    // Find the shared session by invite code
    const sharedSession = await prisma.sharedSession.findUnique({
      where: {
        inviteCode,
      },
      include: {
        participants: true
      }
    });
    
    if (!sharedSession) {
      return new NextResponse("Shared session not found", { status: 404 });
    }
    
    // Check if the session is still active
    if (!sharedSession.isActive) {
      return new NextResponse("This shared session has ended", { status: 400 });
    }
    
    // Check if user is already a participant
    const isParticipantAlready = sharedSession.participants.some(
      (participant: { userId: string }) => participant.userId === auth.userId
    );
    
    if (isParticipantAlready) {
      return new NextResponse("You are already in this session", { status: 409 });
    }
    
    // Add user as a participant
    const participant = await prisma.sharedSessionParticipant.create({
      data: {
        sessionId: sharedSession.id,
        userId: auth.userId,
      },
      include: {
        session: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            },
            creator: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });
    
    // Type assertion to handle the session property
    return NextResponse.json(participant.session as any);
  } catch (error) {
    console.error("[SHARED_SESSION_JOIN_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 