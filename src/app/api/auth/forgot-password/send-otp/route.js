import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP for Forgot Password",
      text: `Your OTP for resetting the password is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

// Named export for POST method
export async function POST(req) {
  try {
    const { email } = await req.json();
    

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const otpSent = await prisma.otp.create({
        data: {
          email: user.email,
          otp: otp.toString(),
          expiresAt,
        },
      });

    await sendOtpEmail(email, otp);
    return NextResponse.json(
      { message: "OTP sent successfully", otpSent },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

// Export other methods (if any) as needed
