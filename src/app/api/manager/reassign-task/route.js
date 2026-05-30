import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/utils/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession({ req, ...authOptions });

    if (!session || session.user.role !== "MANAGER") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { taskId, newUser } = await req.json();

    const task = await prisma.task.update({
        where: {id: taskId},
      data: {userId: newUser},
    });

    return Response.json({ message: "Task reassigned successfully", task }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
