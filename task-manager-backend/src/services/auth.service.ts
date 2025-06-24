import jwt, { SignOptions } from "jsonwebtoken";
import { User, IUser } from "../models/user.model";
import { env } from "../config/env";
import { createError } from "../middleware/errorHandler";
import logger from "../utils/logger";
import mongoose from "mongoose";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "CEO" | "Manager" | "Employee";
  managerId?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}

export class AuthService {
  generateToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any,
    };

    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw createError("User with this email already exists", 400);
      }

      // Handle CEO registration - they shouldn't have a manager
      if (data.role === "CEO") {
        if (data.managerId) {
          throw createError("CEO cannot have a manager", 400);
        }

        // Check if CEO already exists
        const existingCEO = await User.findOne({ role: "CEO" });
        if (existingCEO) {
          throw createError("Only one CEO can exist in the system", 400);
        }
      }

      // Validate manager assignment for non-CEO roles
      if (data.role !== "CEO") {
        if (!data.managerId) {
          throw createError("Manager ID is required for non-CEO roles", 400);
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(data.managerId)) {
          throw createError("Invalid manager ID format", 400);
        }

        const manager = await User.findById(data.managerId);
        if (!manager) {
          throw createError("Manager not found", 404);
        }

        // Ensure manager has appropriate role
        if (data.role === "Manager" && manager.role !== "CEO") {
          throw createError("Managers can only be assigned by CEO", 400);
        }

        if (data.role === "Employee" && manager.role === "Employee") {
          throw createError("Employees cannot assign other employees", 400);
        }
      }

      // Prepare user data - exclude managerId for CEO
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        ...(data.role !== "CEO" && data.managerId
          ? { managerId: data.managerId }
          : {}),
      };

      // Create new user
      const user = new User(userData);
      await user.save();

      const token = this.generateToken(user);

      logger.info(`New user registered: ${user.email} with role ${user.role}`);

      return { user, token };
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await User.findOne({ email: data.email });
      if (!user) {
        throw createError("Invalid email or password", 401);
      }

      // Check password
      const isPasswordValid = await user.comparePassword(data.password);
      if (!isPasswordValid) {
        throw createError("Invalid email or password", 401);
      }

      const token = this.generateToken(user);

      logger.info(`User logged in: ${user.email}`);

      return { user, token };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        throw createError("User not found", 401);
      }

      return user;
    } catch (error) {
      logger.error("Token validation error:", error);
      throw createError("Invalid token", 401);
    }
  }
}

export const authService = new AuthService();
export default authService;
