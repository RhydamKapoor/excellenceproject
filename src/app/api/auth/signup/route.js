import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/utils/db";
// import connectDB from "@/utils/db";
// import User from "@/models/User";

export async function POST(req) {
  // await connectDB();
  try {
    const { firstName, lastName, email, password, role } = await req.json();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && (existingUser.provider === "google" || existingUser.provider === "slack")){

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.update({
        where: { email: existingUser.email },
        data: { password: hashedPassword, role },
      })
      
    return NextResponse.json(
      { message: "User updated successfully", user: newUser },
      { status: 200 }
    );
    }
    if(existingUser && existingUser.provider === "credentials"){
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword, role, provider: "credentials" },
    });
    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
