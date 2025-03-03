export const dynamic = "error";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Required for static generation with dynamic routes
export function generateStaticParams() {
  return [{ taskId: 'placeholder' }];
}

// Update a task (mark as complete/incomplete)
export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    // For static export, return a mock updated task
    if (process.env.NEXT_EXPORT === 'true') {
      const { isCompleted } = await request.json();
      return NextResponse.json({
        id: params.taskId,
        isCompleted,
        title: 'Mock Task',
        description: 'This is a mock task for static export',
        userId: 'guest-user',
        updatedAt: new Date().toISOString(),
        completedAt: isCompleted ? new Date().toISOString() : null
      });
    }
    
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { taskId } = params;
    const { isCompleted, userId } = await request.json();
    
    // Ensure the user is modifying their own data
    if (userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    
    // Check if task exists
    if (!task) {
      return new NextResponse("Task not found", { status: 404 });
    }
    
    // Ensure the user owns the task
    if (task.userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Update task completion status
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
    
    // If task was just completed, update user's total tasks done count
    if (isCompleted && !task.isCompleted) {
      await prisma.user.update({
        where: {
          id: auth.userId,
        },
        data: {
          totalTasksDone: {
            increment: 1,
          }
        }
      });
    }
    
    // If task was just uncompleted, decrease user's total tasks done count
    if (!isCompleted && task.isCompleted) {
      await prisma.user.update({
        where: {
          id: auth.userId,
        },
        data: {
          totalTasksDone: {
            decrement: 1,
          }
        }
      });
    }
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[TASK_UPDATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    // For static export, return success
    if (process.env.NEXT_EXPORT === 'true') {
      return NextResponse.json({ deleted: true, id: params.taskId });
    }
    
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { taskId } = params;
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    
    // Check if task exists
    if (!task) {
      return new NextResponse("Task not found", { status: 404 });
    }
    
    // Ensure the user owns the task
    if (task.userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Delete the task
    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });
    
    // If task was completed, decrease user's total tasks done count
    if (task.isCompleted) {
      await prisma.user.update({
        where: {
          id: auth.userId,
        },
        data: {
          totalTasksDone: {
            decrement: 1,
          }
        }
      });
    }
    
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[TASK_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 