// src/socket.js  — singleton socket.io-client instance
import { io } from "socket.io-client";

let socket = null;

export function getSocket(token) {
  if (!socket || socket.disconnected) {
    socket = io("http://localhost:4000", {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
