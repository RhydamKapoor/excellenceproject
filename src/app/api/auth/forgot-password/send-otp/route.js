import { prisma } from "@/utils/db";
import { sendMail } from "@/utils/mail";
import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/appConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sendOtpEmail = async (email, otp) => {
  await sendMail({
    to: email,
    subject: `Your ${APP_NAME} password reset code`,
    text: `Your OTP for resetting your password is: ${otp}\n\nThis code expires in 15 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 12px">Password reset</h2>
        <p style="color:#64748b;margin:0 0 16px">Use this verification code to reset your ${APP_NAME} password:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:0 0 16px">${otp}</p>
        <p style="color:#64748b;font-size:14px;margin:0">This code expires in 15 minutes.</p>
      </div>
    `,
  });
};

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otp.create({
      data: {
        email: user.email,
        otp: otp.toString(),
        expiresAt,
      },
    });

    await sendOtpEmail(user.email, otp);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending OTP:", error);

    if (error.code === "EAUTH") {
      return NextResponse.json(
        {
          message:
            "Email service is not configured correctly. Use a Gmail App Password in EMAIL_PASS (16 characters, no spaces).",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
  }
}
