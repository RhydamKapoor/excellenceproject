"use client";

import { io } from "socket.io-client";

// Add connection options and error handling
export const socket = io("http://localhost:3000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: false, 
});

// Add connection event listeners
socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("connect_timeout", (timeout) => {
  console.error("Socket connection timeout:", timeout);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});

// Add connection success listener
socket.on("connect", () => {
  console.log("Socket connected successfully!");
});