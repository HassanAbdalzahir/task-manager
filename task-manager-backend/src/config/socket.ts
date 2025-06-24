import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "./env";
import logger from "../utils/logger";

export const setupSocketIO = (server: HTTPServer): Server => {
  const io = new Server(server, {
    path: env.SOCKET_PATH,
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
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

      // For now, we'll just validate the token format
      // In a real implementation, you'd verify the JWT here
      if (actualToken && actualToken.length > 10) {
        socket.data.userId = actualToken; // This would be the decoded user ID
        next();
      } else {
        next(new Error("Authentication error: Invalid token"));
      }
    } catch (error) {
      next(new Error("Authentication error: Token verification failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join user to their personal room
    if (socket.data.userId) {
      socket.join(socket.data.userId);
      logger.info(`User ${socket.data.userId} joined their room`);
    }

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      logger.error("Socket error:", error);
    });
  });

  return io;
};

export default setupSocketIO;
