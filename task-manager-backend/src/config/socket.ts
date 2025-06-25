import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "./env";
import logger from "../utils/logger";
import jwt from "jsonwebtoken";

export const setupSocketIO = (server: HTTPServer): Server => {
  const io = new Server(server, {
    path: env.SOCKET_PATH,
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        env.CLIENT_URL,
      ].filter(Boolean),
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    try {
      // Extract token from "Bearer TOKEN" format if needed
      const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;

      // Verify JWT token
      const decoded = jwt.verify(actualToken, env.JWT_SECRET) as any;

      if (decoded && decoded.userId) {
        socket.data.userId = decoded.userId;
        socket.data.userEmail = decoded.email;
        socket.data.userRole = decoded.role;
        socket.data.workspaceId = decoded.workspaceId;
        next();
      } else {
        next(new Error("Authentication error: Invalid token payload"));
      }
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Authentication error: Token verification failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`User connected: ${socket.id} (${socket.data.userEmail})`);

    // Join user to their personal room
    if (socket.data.userId) {
      socket.join(socket.data.userId);
      logger.info(
        `User ${socket.data.userId} (${socket.data.userEmail}) joined their room`
      );
    }

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id} (${socket.data.userEmail})`);
    });

    socket.on("error", (error) => {
      logger.error("Socket error:", error);
    });
  });

  return io;
};

export default setupSocketIO;
