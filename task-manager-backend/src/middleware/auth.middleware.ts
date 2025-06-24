import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, IUser } from "../models/user.model";
import logger from "../utils/logger";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Fetch user from database to ensure they still exist
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Authentication failed",
      });
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

export const requireManagerOrHigher = requireRole(["CEO", "Manager"]);
export const requireCEO = requireRole(["CEO"]);
export const requireManager = requireRole(["Manager"]);
export const requireEmployee = requireRole(["Employee"]);

export default authenticateToken;
