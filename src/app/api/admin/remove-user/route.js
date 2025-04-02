import { NextResponse } from "next/server";
import { prisma } from "@/utils/db"; // Assuming this is your Prisma client instance

export async function POST(req) {
  try {
    const { userId, managerId } = await req.json();

    // Validate request body
    if (!userId || !managerId) {
      return NextResponse.json(
        { message: "userId and managerId are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if manager exists
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager) {
      return NextResponse.json({ message: "Manager not found" }, { status: 404 });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { managerId: null },
      });

    // Update manager's assignedUsers array
    await prisma.user.update({
      where: { id: managerId },
      data: {
        assignedUsers: {
          set: manager.assignedUsers?.filter(id => id !== userId) || [],
        },
      },
    });

    return NextResponse.json({ message: "User removed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error assigning manager:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
