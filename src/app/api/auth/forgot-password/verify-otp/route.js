import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    // Find OTP in database
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email: email,
        otp,
      },
    });

    if (!otpRecord) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // Check if OTP has expired
    if (new Date(otpRecord.expiresAt) < new Date()) {
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
    }

    // OTP is valid
    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in verifying OTP:", error);
    return NextResponse.json({ message: "Failed to verify OTP" }, { status: 500 });
  }
}
