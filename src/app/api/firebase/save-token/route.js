import { prisma } from "@/utils/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // Don't forget this import
import { authOptions } from "../../auth/[...nextauth]/route";

export const POST = async (req) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  

  try {
    const { fcmToken } = await req.json();

    // Check if session.user.id exists and is valid
    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Invalid user session" }, { status: 400 });
    }

    try {
      // Log the user ID for debugging
      
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        // Update the user with the FCM token
        await prisma.user.update({
          where: { id: user.id },
          data: {
            fcmToken
          },
        });


      return NextResponse.json({ message: "User token added!" }, { status: 200 });
    } catch (prismaError) {
      console.error("Prisma error:", prismaError);
      // Check for specific Prisma error codes
      if (prismaError.code === 'P2023') {
        return NextResponse.json({ 
          error: "Invalid user ID format", 
          details: "The user ID format is not valid for MongoDB" 
        }, { status: 400 });
      }
      return NextResponse.json({ error: "Database error", details: prismaError.message }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Error in save-token route:", error);
    return NextResponse.json({ error: "Failed to add user token" }, { status: 500 });
  }
};
