import { Server } from "socket.io";
import { NextResponse } from "next/server";

export const GET = async () => {
  if (!global.io) {
    console.log("🔌 Setting up Socket.io...");
    global.io = new Server(3001, { cors: { origin: "*", methods: ["GET", "POST"] } });

    global.io.on("connection", (socket) => {
      console.log("🟢 A user connected:", socket.id);
      
      socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);
      });
    });
  }

  return NextResponse.json({ message: "Socket.io running on 3001" });
};
