import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*",
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
