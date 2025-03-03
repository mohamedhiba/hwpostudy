export const dynamic = "force-static";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    // Verify authentication using our helper
    console.log("Sessions/start: Verifying authentication");
    const auth = await verifyAuth();
    console.log("Sessions/start: Auth result:", auth);
    
    if (!auth.authenticated || !auth.userId) {
      console.log("Sessions/start: Authentication failed");
      return auth.response;
    }
    
    const body = await request.json();
    console.log("Sessions/start: Request body:", body);
    const { mode } = body;
    
    // Create a new study session for the user
    console.log("Sessions/start: Creating study session for user:", auth.userId);
    const studySession = await prisma.studySession.create({
      data: {
        userId: auth.userId,
        startTime: new Date(),
        mode: mode // Use the mode from the request
      }
    });
    
    console.log("Sessions/start: Study session created successfully:", studySession);
    return NextResponse.json(studySession);
  } catch (error) {
    console.error("[SESSION_START_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 