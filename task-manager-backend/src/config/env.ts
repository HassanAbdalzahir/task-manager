import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const env = {
  PORT: process.env.PORT || 3100,
  MONGO_URI:
    process.env.MONGO_URI ||
    "mongodb://taskmanager:password@localhost:27017/task-manager?authSource=admin",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  SOCKET_PATH: process.env.SOCKET_PATH || "/socket.io",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

// Only validate truly required environment variables (those without defaults)
const requiredEnvVars: string[] = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default env;
