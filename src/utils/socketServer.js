import { Server } from "socket.io";
import { getSocketCorsOrigin } from "@/lib/serverConfig";

let io;

export const initSocket = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: getSocketCorsOrigin(),
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("⚡ A user connected:", socket.id);
    });
  }
  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};
