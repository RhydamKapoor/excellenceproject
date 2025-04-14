// app/api/send-notification/route.js
import { NextResponse } from "next/server";
import { Server } from "socket.io";
// import { socket } from "@/socket";


export async function POST(req) {
  const { userId, message } = await req.json();

  if (!userId || !message) {
    return NextResponse.json({ error: "Missing userId or message" }, { status: 400 });
  }
  // Emit to the specific user
  const io = new Server()
  io.emit("receiveNotification", { message });

  return NextResponse.json({ success: true }, {status: 200});
}
