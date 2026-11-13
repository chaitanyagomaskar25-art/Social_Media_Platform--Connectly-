import React, { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  isUserOnline: () => false,
});

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(() => getSocket());
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());

  useEffect(() => {
    const s = connectSocket(user, token);
    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      s.emit("get_presence");
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onPresenceUpdated = (data) => {
      if (Array.isArray(data?.onlineUserIds)) {
        setOnlineUsers(new Set(data.onlineUserIds.map(String)));
      }
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("presence:updated", onPresenceUpdated);

    if (s.connected) {
      setIsConnected(true);
      s.emit("get_presence");
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("presence:updated", onPresenceUpdated);
    };
  }, [user?.id, user?._id, token]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(String(userId));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        isUserOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
