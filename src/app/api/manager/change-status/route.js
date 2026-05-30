import { getAppSession } from "@/lib/auth";
import { prisma } from "@/utils/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getAppSession();

    if (!session || session.user.role !== "MANAGER") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, status, feedBack } = await req.json();

    const task = await prisma.task.update({
        where: {id},
        data: { status, feedBack },
    });

    return Response.json({ message: "Status updated successfully", task }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
