import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";


const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : process.env.HOSTNAME;
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize Socket.IO
 const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }
  
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });


  // Example: Send notification to user every 10 sec (for testing)
  // setInterval(() => {
  //   sendNotificationToUser("USER_ID_HERE", "This is a test notification");
  // }, 10000);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
