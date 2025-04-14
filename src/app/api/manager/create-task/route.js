import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "MANAGER") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
    

    const { title, description, userId } = await req.json();


    const task = await prisma.task.create({
      data: {
        title,
        description,
        userId,
        managerId: session.user.id,
      },
    });
    
    return NextResponse.json({ message: "Task created successfully", task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
