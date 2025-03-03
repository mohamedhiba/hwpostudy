export const dynamic = "force-static";

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
    
    // Get the task
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    
    // Check if task exists and belongs to user
    if (!existingTask || existingTask.userId !== userId) {
      return new NextResponse("Task not found", { status: 404 });
    }
    
    // Update the task
    const updateData: { 
      isCompleted: boolean; 
      completedAt?: Date | null; 
    } = {
      isCompleted,
    };
    
    // If task is being marked as completed, add completion date and increment user's total tasks
    if (isCompleted && !existingTask.isCompleted) {
      updateData.completedAt = new Date();
      
      // Increment user's completed tasks count
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          totalTasksDone: {
            increment: 1,
          }
        }
      });
    }
    
    // If task is being marked as incomplete, remove completion date and decrement user's total tasks
    if (!isCompleted && existingTask.isCompleted) {
      updateData.completedAt = null;
      
      // Decrement user's completed tasks count
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          totalTasksDone: {
            decrement: 1,
          }
        }
      });
    }
    
    const task = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: updateData,
    });
    
    return NextResponse.json(task);
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
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { taskId } = params;
    const { userId } = await request.json();
    
    // Ensure the user is modifying their own data
    if (userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Get the task
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    
    // Check if task exists and belongs to user
    if (!existingTask || existingTask.userId !== userId) {
      return new NextResponse("Task not found", { status: 404 });
    }
    
    // If task was completed, decrement user's total tasks
    if (existingTask.isCompleted) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          totalTasksDone: {
            decrement: 1,
          }
        }
      });
    }
    
    // Delete the task
    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TASK_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 