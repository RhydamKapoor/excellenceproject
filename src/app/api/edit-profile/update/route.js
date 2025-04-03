import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/utils/db";
import bcrypt from "bcryptjs";

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, firstName, lastName, email, newPassword, oldPassword } = await req.json();

    const user = await prisma.user.findUnique({where: { id: session?.user?.id }});
    if (!user) {
      return NextResponse.json({message: `User not found!`}, { status: 404 });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({message: `Invalid password`}, { status: 401 });
    }

    let updatedData = { firstName, lastName, email };

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updatedData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json(updatedUser, {message: `Profile updated successfully`} ,{ status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
