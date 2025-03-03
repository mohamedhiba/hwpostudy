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
    
    const { mode, minutes } = await request.json();
    
    // Create a new study session with start and end time
    const studySession = await prisma.studySession.create({
      data: {
        userId: auth.userId,
        startTime: new Date(Date.now() - (minutes * 60 * 1000)), // Set start time based on elapsed minutes
        endTime: new Date(),
        duration: minutes, // Already in minutes
        mode: mode || "focus"
      }
    });
    
    // Update user's total study time
    await prisma.user.update({
      where: {
        id: auth.userId,
      },
      data: {
        totalStudyTime: {
          increment: minutes
        }
      }
    });
    
    return NextResponse.json(studySession);
  } catch (error) {
    console.error("[SESSION_SAVE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 