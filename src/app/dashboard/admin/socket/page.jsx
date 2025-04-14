"use client";

import { useEffect, useState } from "react";
import { socket } from "@/socket";
import { useSession } from "next-auth/react";
import axios from "axios";

export default function SocketPage() {
  const { data: session } = useSession();
  const [notification, setNotification] = useState("");

  socket.connect();

  socket.on("receiveNotification", (data) => {
    console.log("Notification received:", data.message);
    setNotification(data.message);
  });
  useEffect(() => {
    if (session?.user?.id) {
      // Set userId in query params
      socket.io.opts.query = {
        userId: session.user.id,
      };

      // Now connect the socket

      return () => {
        socket.disconnect();
      };
    }
  }, [session]);

  // Dummy function to test (you would call an API here ideally)
  async function handleSendNotification() {
    console.log("Send notification clicked");
  
    if (!session?.user?.id) {
      console.error("No session or user ID");
      return;
    }
  
    try {
      const res = await axios.post("/api/send-notification", {
          userId: session.user.id, // you can even allow sending to others later
          message: "Hello, you have a new notification!",
        })
        console.log(res);
        
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chat Page</h1>

      {notification && (
        <div className="bg-green-200 p-3 mb-4 rounded-lg">
          Notification: {notification}
        </div>
      )}

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleSendNotification}
      >
        Send Test Notification
      </button>
    </div>
  );
}
