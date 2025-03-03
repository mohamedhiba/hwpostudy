export const dynamic = "force-static";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// GET tasks for a user
export async function GET(request: Request) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    // Ensure the user is accessing their own data
    if (!userId || userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Get user's tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId,
      },
      orderBy: [
        { isCompleted: 'asc' },
        { createdAt: 'desc' },
      ],
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[TASKS_GET_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Create a new task
export async function POST(request: Request) {
  try {
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { userId, title, description } = await request.json();
    
    // Ensure the user is modifying their own data
    if (userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Create a new task
    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        isCompleted: false,
      }
    });
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_CREATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 