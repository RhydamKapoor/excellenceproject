import { getAppSession } from "@/lib/auth";
import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = await getAppSession();

    if (!session || session.user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id, 
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        feedBack: true
      },
    });
    return NextResponse.json(tasks,{message: `Fetched Successfully`}, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
