import { createServer } from "http";
import { env } from "./config/env";
import { setupSocketIO } from "./config/socket";
import { setupTaskSockets } from "./sockets/task.socket";
import App from "./app";
import logger from "./utils/logger";

class Server {
  private app: App;
  private server: any;
  private io: any;

  constructor() {
    this.app = new App();
    this.server = createServer(this.app.app);
    this.io = setupSocketIO(this.server);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.app.connectDatabase();

      // Setup Socket.io handlers
      setupTaskSockets(this.io);

      // Start server
      this.server.listen(env.PORT, () => {
        logger.info(`🚀 Server running on port ${env.PORT}`);
        logger.info(`📊 Environment: ${env.NODE_ENV}`);
        logger.info(`🔗 API Documentation: http://localhost:${env.PORT}/api`);
        logger.info(`🔌 Socket.io path: ${env.SOCKET_PATH}`);
        logger.info(`🌐 Client URL: ${env.CLIENT_URL}`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      this.server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await this.app.disconnectDatabase();
          logger.info("Database disconnected");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", { promise, reason });
      shutdown("unhandledRejection");
    });
  }

  public getIO(): any {
    return this.io;
  }
}

// Start the server
const server = new Server();
server.start();

export default server;
