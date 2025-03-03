export const dynamic = "force-static";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";
import { nanoid } from "nanoid";

// Create a new shared session
export async function POST(request: Request) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated || !auth.userId) {
      return auth.response;
    }
    
    const { name, timerMode, duration } = await request.json();
    
    // Generate a unique invite code
    const inviteCode = nanoid(8);
    
    // Create a new shared session
    const sharedSession = await prisma.sharedSession.create({
      data: {
        name,
        creatorId: auth.userId,
        timerMode: timerMode || "focus",
        duration: duration || 1500, // Default to 25 minutes
        inviteCode,
        // Add creator as a participant
        participants: {
          create: {
            userId: auth.userId
          }
        }
      },
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
        }
      }
    });
    
    return NextResponse.json(sharedSession);
  } catch (error) {
    console.error("[SHARED_SESSION_CREATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Get user's shared sessions
export async function GET(request: Request) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated || !auth.userId) {
      return auth.response;
    }
    
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    
    // Get active sessions the user is part of
    const sharedSessions = await prisma.sharedSessionParticipant.findMany({
      where: {
        userId: auth.userId,
        session: active === 'true' ? { isActive: true } : undefined
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
    
    return NextResponse.json(sharedSessions.map((participant: any) => {
      return participant.session as any;
    }));
  } catch (error) {
    console.error("[SHARED_SESSION_LIST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 