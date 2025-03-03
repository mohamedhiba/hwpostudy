export const dynamic = "force-static";

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
    
    const { sessionId, duration } = await request.json();
    
    // Update the study session with end time and duration
    const studySession = await prisma.studySession.update({
      where: {
        id: sessionId,
      },
      data: {
        endTime: new Date(),
        duration,
      }
    });
    
    // Update user's total study time
    await prisma.user.update({
      where: {
        id: auth.userId,
      },
      data: {
        totalStudyTime: {
          increment: duration,
        }
      }
    });
    
    return NextResponse.json(studySession);
  } catch (error) {
    console.error("[SESSION_END_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 