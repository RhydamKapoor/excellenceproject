import { getAppSession } from "@/lib/auth";
import { prisma } from "@/utils/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getAppSession();

    if (!session || session.user.role !== "MANAGER") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { managerId: session.user.id, role: "USER" },
      select: {id: true, firstName: true, lastName: true, email: true },
    });

    return Response.json(users, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
