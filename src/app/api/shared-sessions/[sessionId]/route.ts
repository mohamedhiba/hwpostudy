import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Get a specific shared session
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.sessionId;
    
    const sharedSession = await prisma.sharedSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!sharedSession) {
      return NextResponse.json(
        { error: 'Shared session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sharedSession);
  } catch (error) {
    console.error('Error getting shared session:', error);
    return NextResponse.json(
      { error: 'Failed to get shared session' },
      { status: 500 }
    );
  }
}

// Update a shared session (starting, stopping, changing mode)
export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { sessionId } = params;
    const { action, timerMode, duration } = await request.json();
    
    // Get the shared session
    const sharedSession = await prisma.sharedSession.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        participants: true
      }
    });
    
    if (!sharedSession) {
      return new NextResponse("Shared session not found", { status: 404 });
    }
    
    // Check if user is the creator (only creator can update session settings)
    if (sharedSession.creatorId !== auth.userId) {
      return new NextResponse("Only the creator can update the session", { status: 403 });
    }
    
    // Handle different actions
    let updatedSession;
    
    switch (action) {
      case 'start':
        updatedSession = await prisma.sharedSession.update({
          where: { id: sessionId },
          data: {
            startTime: new Date(),
            endTime: null,
          }
        });
        break;
        
      case 'stop':
        updatedSession = await prisma.sharedSession.update({
          where: { id: sessionId },
          data: {
            endTime: new Date(),
          }
        });
        break;
        
      case 'update':
        updatedSession = await prisma.sharedSession.update({
          where: { id: sessionId },
          data: {
            timerMode: timerMode || sharedSession.timerMode,
            duration: duration || sharedSession.duration,
          }
        });
        break;
        
      case 'complete':
        // When a session is completed, mark it as inactive
        updatedSession = await prisma.sharedSession.update({
          where: { id: sessionId },
          data: {
            isActive: false,
            endTime: new Date(),
          }
        });
        
        // Add study time to all participants' totals
        const studyDuration = Math.floor((sharedSession.duration || 1500) / 60); // Convert seconds to minutes
        
        // Update all participants' study time
        await Promise.all(
          sharedSession.participants.map((participant: { userId: string }) => 
            prisma.user.update({
              where: {
                id: participant.userId,
              },
              data: {
                totalStudyTime: {
                  increment: studyDuration,
                }
              }
            })
          )
        );
        break;
        
      default:
        return new NextResponse("Invalid action", { status: 400 });
    }
    
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("[SHARED_SESSION_UPDATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Delete a shared session
export async function DELETE(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const auth = await verifyAuth();
    if (!auth.authenticated || !auth.userId) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    const sharedSession = await prisma.sharedSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!sharedSession) {
      return NextResponse.json(
        { error: 'Shared session not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = sharedSession.participants.some(
      (participant: { userId: string }) => participant.userId === auth.userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this session' },
        { status: 403 }
      );
    }

    // Check if user is the creator of the session
    const isCreator = sharedSession.creatorId === auth.userId;

    if (isCreator) {
      // If creator is leaving, end the session for everyone
      await prisma.sharedSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endTime: new Date(),
        },
      });

      return NextResponse.json(
        { message: 'Shared session ended successfully' },
        { status: 200 }
      );
    } else {
      // If not the creator, just remove this user from the session
      await prisma.sharedSessionParticipant.deleteMany({
        where: {
          sessionId: sessionId,
          userId: auth.userId,
        },
      });

      return NextResponse.json(
        { message: 'Left shared session successfully' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error deleting shared session:', error);
    return NextResponse.json(
      { error: 'Failed to delete shared session' },
      { status: 500 }
    );
  }
}

// PUT - Update a shared session status
export async function PUT(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.sessionId;
    const { studyTime } = await request.json();

    const sharedSession = await prisma.sharedSession.findUnique({
      where: { id: sessionId },
      include: { 
        participants: true 
      },
    });

    if (!sharedSession) {
      return NextResponse.json(
        { error: 'Shared session not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = sharedSession.participants.some(
      (participant: { userId: string }) => participant.userId === auth.userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this session' },
        { status: 403 }
      );
    }

    // Get all participant ids to update their study time
    const participantIds = sharedSession.participants.map(
      (participant: { id: string }) => participant.id
    );

    // Update study time for all participants
    if (participantIds.length > 0 && studyTime && studyTime > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: sharedSession.participants.map(
              (participant: { userId: string }) => participant.userId
            ),
          },
        },
        data: {
          totalStudyTime: {
            increment: studyTime,
          },
        },
      });
    }

    return NextResponse.json(
      { message: 'Shared session updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating shared session:', error);
    return NextResponse.json(
      { error: 'Failed to update shared session' },
      { status: 500 }
    );
  }
} 