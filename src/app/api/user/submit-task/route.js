import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, id } = await req.json();

    if (!id || !message) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        reportMessage: message,
      },
    });

    return NextResponse.json({ message: "Task submitted successfully", updatedTask }, { status: 200 });
  } catch (error) {
    console.error("Error submitting task:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
