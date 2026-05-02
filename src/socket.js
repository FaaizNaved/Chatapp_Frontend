import { io } from "socket.io-client";

const SERVER = import.meta.env.VITE_API_URL || "http://localhost:4000";

let socket = null;

export function getSocket(token) {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(SERVER, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
