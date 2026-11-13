import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (user = null, token = null) => {
  if (socket) {
    if (user?.id || user?._id) {
      socket.auth = {
        userId: user.id || user._id,
        token: token || localStorage.getItem("connectly_token") || undefined,
      };
      if (socket.connected) {
        socket.emit("authenticate", socket.auth);
      }
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: {
      userId: user?.id || user?._id || undefined,
      token: token || localStorage.getItem("connectly_token") || undefined,
    },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
