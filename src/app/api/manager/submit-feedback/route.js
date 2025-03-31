import { prisma } from "@/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req) {
  try {
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== "MANAGER") {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
      }
  
    const { feedBack, taskId, status } = await req.json();

    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    // Find the task by ID
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        feedBack,
        status,
      },
    });

    return NextResponse.json({ message: "Feedback submitted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
