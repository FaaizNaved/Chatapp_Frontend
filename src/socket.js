import { io } from "socket.io-client";

let socket = null;

function resolveSocketUrl() {
  const configuredUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/api\/?$/, "");
  }

  return window.location.origin;
}

export function getSocket(token) {
  if (socket) {
    socket.auth = { token };
    if (socket.disconnected) {
      socket.connect();
    }

    return socket;
  }

  socket = io(resolveSocketUrl(), {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
