import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log(session);
    
    if (!session || session?.user?.role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all tasks created by this manager
    const tasks = await prisma.task.findMany({
      where: { managerId: session.user.id }, // Correct field
    });

    if(!tasks){
      return NextResponse.json({message: `No tasks found!`}, {status: 404});
    }

    // Fetch user details for assigned tasks
    const userIds = tasks.map((task) => task.userId)
    .filter((id) => id && id.trim() !== ""); // Get all assigned user IDs
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    // Map user details to tasks
    const tasksWithUsers = tasks.map((task) => ({
      ...task,
      assignedUsers: users.find((user) => user.id === task.userId) || null,
    }));

    return NextResponse.json(tasksWithUsers, {message: `Tasks fetched successfully!`}, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
