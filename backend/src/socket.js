import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;
const onlineUsers = new Map(); // userId -> Set of socket.ids
const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const addOnlineUser = (userId, socketId) => {
  if (!userId) return;
  const uid = String(userId);
  if (!onlineUsers.has(uid)) {
    onlineUsers.set(uid, new Set());
  }
  onlineUsers.get(uid).add(socketId);
  if (io) {
    io.emit("presence:updated", { onlineUserIds: getOnlineUserIds() });
  }
};

const removeOnlineUser = (userId, socketId) => {
  if (!userId) return;
  const uid = String(userId);
  const userSockets = onlineUsers.get(uid);
  if (userSockets) {
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      onlineUsers.delete(uid);
    }
  }
  if (io) {
    io.emit("presence:updated", { onlineUserIds: getOnlineUserIds() });
  }
};

const parseCookies = (cookieHeader = "") => {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k]) => Boolean(k))
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );
};

export const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Socket origin not allowed by CORS."));
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers?.cookie);
      const token = socket.handshake.auth?.token || cookies.access_token;

      if (token && process.env.ACCESS_TOKEN) {
        try {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
          socket.userId = decoded.userId;
        } catch {
          // Token invalid or expired; allow guest connection
        }
      }

      if (!socket.userId && socket.handshake.auth?.userId) {
        socket.userId = String(socket.handshake.auth.userId);
      }

      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      addOnlineUser(socket.userId, socket.id);
    }

    // Send current online user list immediately
    socket.emit("presence:updated", { onlineUserIds: getOnlineUserIds() });

    socket.on("authenticate", (auth) => {
      const targetUserId = auth?.userId || socket.userId;
      if (targetUserId) {
        socket.userId = String(targetUserId);
        socket.join(`user:${socket.userId}`);
        addOnlineUser(socket.userId, socket.id);
      }
    });

    socket.on("join_user", (userId) => {
      if (userId) {
        socket.userId = String(userId);
        socket.join(`user:${userId}`);
        addOnlineUser(userId, socket.id);
      }
    });

    socket.on("get_presence", () => {
      socket.emit("presence:updated", { onlineUserIds: getOnlineUserIds() });
    });

    socket.on("join_post", (postId) => {
      if (postId) {
        socket.join(`post:${postId}`);
      }
    });

    socket.on("leave_post", (postId) => {
      if (postId) {
        socket.leave(`post:${postId}`);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        removeOnlineUser(socket.userId, socket.id);
      }
    });
  });

  return io;
};

export const getIO = () => io;

export const emitPostLiked = ({ postId, likesCount, userId, action }) => {
  if (!io) return;
  io.emit("post:like_updated", {
    postId: String(postId),
    likesCount,
    userId: String(userId),
    action,
    timestamp: Date.now(),
  });
};

export const emitCommentAdded = ({ postId, comment, commentCount }) => {
  if (!io) return;
  io.emit("comment:added", {
    postId: String(postId),
    comment,
    commentCount,
    timestamp: Date.now(),
  });
};

export const emitCommentDeleted = ({ postId, commentId, commentIds, commentCount }) => {
  if (!io) return;
  io.emit("comment:deleted", {
    postId: String(postId),
    commentId: String(commentId),
    commentIds: (commentIds || [commentId]).map(String),
    commentCount,
    timestamp: Date.now(),
  });
};

export const emitCommentUpdated = ({ postId, comment }) => {
  if (!io) return;
  io.emit("comment:updated", {
    postId: String(postId),
    comment,
    timestamp: Date.now(),
  });
};

export const emitStoryCreated = ({ story, author }) => {
  if (!io) return;
  io.emit("story:created", {
    story,
    author,
    timestamp: Date.now(),
  });
};

export const emitStoryUpdated = ({ story, author }) => {
  if (!io) return;
  io.emit("story:updated", {
    story,
    author,
    timestamp: Date.now(),
  });
};

export const emitStoryDeleted = ({ storyId, authorId }) => {
  if (!io) return;
  io.emit("story:deleted", {
    storyId: String(storyId),
    authorId: String(authorId),
    timestamp: Date.now(),
  });
};

export const emitStoryViewed = ({ storyId, authorId, viewerId, viewer, viewersCount }) => {
  if (!io) return;
  io.emit("story:viewed", {
    storyId: String(storyId),
    authorId: String(authorId),
    viewerId: String(viewerId),
    viewer,
    viewersCount,
    timestamp: Date.now(),
  });
};

export const emitPostCreated = ({ post }) => {
  if (!io) return;
  io.emit("post:created", {
    post,
    timestamp: Date.now(),
  });
};

export const emitPostUpdated = ({ post }) => {
  if (!io) return;
  io.emit("post:updated", {
    post,
    timestamp: Date.now(),
  });
};

export const emitPostDeleted = ({ postId }) => {
  if (!io) return;
  io.emit("post:deleted", {
    postId: String(postId),
    timestamp: Date.now(),
  });
};

export const emitNotification = (recipientId, payload) => {
  if (!io || !recipientId) return;
  io.to(`user:${String(recipientId)}`).emit("notification:new", {
    ...payload,
    timestamp: Date.now(),
  });
};

export const emitNotificationDeleted = (recipientId, payload) => {
  if (!io || !recipientId) return;
  io.to(`user:${String(recipientId)}`).emit("notification:deleted", {
    ...payload,
    timestamp: Date.now(),
  });
};

export const emitFollowUpdated = ({
  followerId,
  followingId,
  action,
  followersCount,
  followingCount,
}) => {
  if (!io) return;
  io.emit("follow:updated", {
    followerId: String(followerId),
    followingId: String(followingId),
    action,
    followersCount,
    followingCount,
    timestamp: Date.now(),
  });
};

export const emitFollowRequestUpdated = ({
  requesterId,
  recipientId,
  action,
  request,
}) => {
  if (!io) return;
  const payload = {
    requesterId: String(requesterId),
    recipientId: String(recipientId),
    action,
    request,
    timestamp: Date.now(),
  };
  io.to(`user:${String(recipientId)}`).emit("follow_request:updated", payload);
  io.to(`user:${String(requesterId)}`).emit("follow_request:updated", payload);
};

export const emitUserUpdated = ({ user }) => {
  if (!io || !user) return;
  io.emit("user:updated", {
    user,
    timestamp: Date.now(),
  });
};

export const emitSavedPostUpdated = (userId, { postId, isSaved }) => {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit("saved_post:updated", {
    postId: String(postId),
    isSaved,
    timestamp: Date.now(),
  });
};
