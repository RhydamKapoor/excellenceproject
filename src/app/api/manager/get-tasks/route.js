import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log(session);
    
    if (!session || session.user.role !== "MANAGER") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all tasks created by this manager
    const tasks = await prisma.task.findMany({
      where: { managerId: session.user.id }, // Correct field
    });

    // Fetch user details for assigned tasks
    const userIds = tasks.map((task) => task.userId); // Get all assigned user IDs
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    // Map user details to tasks
    const tasksWithUsers = tasks.map((task) => ({
      ...task,
      assignedTo: users.find((user) => user.id === task.userId) || null,
    }));

    return Response.json(tasksWithUsers, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
