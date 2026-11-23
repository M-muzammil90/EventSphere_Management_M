import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  const url = import.meta.env.VITE_WS_URL || "http://localhost:5000";
  const token = typeof window !== "undefined" ? localStorage.getItem("es_token") : null;

  socket = io(url, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
    auth: {
      token: token || undefined,
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    // console.log("Socket.IO connected:", socket?.id);
  });

  socket.on("connect_error", (_err) => {
    // console.warn("Socket.IO connection error:", err.message);
  });

  return socket;
}

export function refreshSocketAuth() {
  if (socket) {
    const token = typeof window !== "undefined" ? localStorage.getItem("es_token") : null;
    socket.auth = { token: token || undefined };
    if (!socket.connected) {
      socket.connect();
    }
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
