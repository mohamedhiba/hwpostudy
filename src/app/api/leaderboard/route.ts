export const dynamic = "error";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-helpers";

// Mock data for static export
const STATIC_LEADERBOARD = [
  { id: 'user1', name: 'Alex', totalTime: 12600, totalStudyTime: 210, totalTasksDone: 15, isFriend: false },
  { id: 'user2', name: 'Jamie', totalTime: 10800, totalStudyTime: 180, totalTasksDone: 12, isFriend: true },
  { id: 'user3', name: 'Sam', totalTime: 9000, totalStudyTime: 150, totalTasksDone: 10, isFriend: false },
  { id: 'guest-user', name: 'You (Guest)', totalTime: 3600, totalStudyTime: 60, totalTasksDone: 5, isFriend: false }
];

export async function GET(request: Request) {
  try {
    // For static export, return mock data
    if (process.env.NEXT_EXPORT === 'true') {
      return NextResponse.json(STATIC_LEADERBOARD);
    }
    
    // Verify authentication using our helper
    const auth = await verifyAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "studyTime";
    const scope = searchParams.get("scope") || "global";
    const userId = searchParams.get("userId");
    
    // Ensure the user is accessing with their own userId
    if (!userId || userId !== auth.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    let users;
    
    if (scope === "friends") {
      // Get friends leaderboard
      const friendIds = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, status: "ACCEPTED" },
            { addresseeId: userId, status: "ACCEPTED" },
          ],
        },
        select: {
          requesterId: true,
          addressee: {
            select: {
              id: true,
            },
          },
        },
      });
      
      // Extract friend IDs
      const friendIdsSet = new Set<string>();
      
      friendIds.forEach((friendship: {requesterId: string, addressee: {id: string}}) => {
        if (friendship.requesterId !== userId) {
          friendIdsSet.add(friendship.requesterId);
        } else if (friendship.addressee.id !== userId) {
          friendIdsSet.add(friendship.addressee.id);
        }
      });
      
      // Add the current user to the list
      friendIdsSet.add(userId);
      
      users = await prisma.user.findMany({
        where: {
          id: {
            in: Array.from(friendIdsSet),
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
          totalStudyTime: true,
          totalTasksDone: true,
        },
        orderBy: {
          [type === "studyTime" ? "totalStudyTime" : "totalTasksDone"]: "desc",
        },
        take: 50,
      });
      
      // Add isFriend flag to each user
      users = users.map((user: any) => ({
        ...user,
        isFriend: user.id !== userId,
      }));
    } else {
      // Get global leaderboard
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
          totalStudyTime: true,
          totalTasksDone: true,
        },
        orderBy: {
          [type === "studyTime" ? "totalStudyTime" : "totalTasksDone"]: "desc",
        },
        take: 50,
      });
      
      // Check which ones are friends
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, status: "ACCEPTED" },
            { addresseeId: userId, status: "ACCEPTED" },
          ],
        },
        select: {
          requesterId: true,
          addresseeId: true,
        },
      });
      
      const friendIds = new Set<string>();
      friendships.forEach((f: {requesterId: string, addresseeId: string}) => {
        if (f.requesterId === userId) {
          friendIds.add(f.addresseeId);
        } else {
          friendIds.add(f.requesterId);
        }
      });
      
      // Add isFriend flag to each user
      users = users.map((user: any) => ({
        ...user,
        isFriend: friendIds.has(user.id),
      }));
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("[LEADERBOARD_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 