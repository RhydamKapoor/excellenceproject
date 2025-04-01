import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/utils/db";

export async function POST(req) {
  try {
    const { email, password} = await req.json();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser)
      return NextResponse.json(
        { message: "User not found" },
        { status: 400 }
      );

    const hashedPassword = await bcrypt.hash(password, 10);
    const updating = await prisma.user.update({
        where: {email},
        data: {password: hashedPassword},
    });
    return NextResponse.json(
      { message: "Password changed successfully!", updating },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
