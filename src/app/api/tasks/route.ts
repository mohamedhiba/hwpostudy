export const dynamic = "error";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Mock tasks for static export
const STATIC_TASKS = [
  {
    id: 'task1',
    title: 'Study Mathematics',
    description: 'Complete calculus exercises',
    isCompleted: false,
    userId: 'guest-user',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'task2',
    title: 'Read History Book',
    description: 'Chapter 5-7',
    isCompleted: true,
    userId: 'guest-user',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

// GET tasks for a user
export async function GET(request: Request) {
  try {
    // For static export, return mock tasks
    if (process.env.NEXT_EXPORT === 'true') {
      return NextResponse.json(STATIC_TASKS);
    }
    
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
    // For static export, return a mock task
    if (process.env.NEXT_EXPORT === 'true') {
      const { title, description } = await request.json();
      return NextResponse.json({
        id: 'task-' + Date.now(),
        title,
        description,
        isCompleted: false,
        userId: 'guest-user',
        createdAt: new Date().toISOString()
      });
    }
    
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