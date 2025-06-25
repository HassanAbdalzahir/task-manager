import jwt, { SignOptions } from "jsonwebtoken";
import { User, IUser } from "../models/user.model";
import { Workspace } from "../models/workspace.model";
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
  workspaceName?: string; // For CEO registration
  workspaceDescription?: string; // For CEO registration
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
  workspace?: any;
}

export class AuthService {
  generateToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
    };

    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any,
    };

    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Handle CEO registration - create workspace
      if (data.role === "CEO") {
        if (data.managerId) {
          throw createError("CEO cannot have a manager", 400);
        }

        if (!data.workspaceName) {
          throw createError(
            "Workspace name is required for CEO registration",
            400
          );
        }

        // Check if email already exists in any workspace
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
          throw createError("User with this email already exists", 400);
        }

        // Create workspace first
        const workspace = new Workspace({
          name: data.workspaceName,
          description: data.workspaceDescription,
          createdBy: null, // Will be set after user creation
        });
        await workspace.save();

        // Create CEO user
        const user = new User({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          workspaceId: workspace._id,
          requiresPasswordChange: false, // CEOs don't need to change password on first login
        });
        await user.save();

        // Update workspace with CEO as creator
        workspace.createdBy = user._id as mongoose.Types.ObjectId;
        await workspace.save();

        const token = this.generateToken(user);

        logger.info(
          `New CEO registered: ${user.email} with workspace: ${workspace.name}`
        );

        return { user, token, workspace };
      }

      // Handle non-CEO registration
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

      // Check if email already exists in the same workspace
      const existingUser = await User.findOne({
        email: data.email,
        workspaceId: manager.workspaceId,
      });
      if (existingUser) {
        throw createError(
          "User with this email already exists in this workspace",
          400
        );
      }

      // Ensure manager has appropriate role
      if (data.role === "Manager" && manager.role !== "CEO") {
        throw createError("Managers can only be assigned by CEO", 400);
      }

      if (data.role === "Employee" && manager.role === "Employee") {
        throw createError("Employees cannot assign other employees", 400);
      }

      // Create user in the same workspace as manager
      const user = new User({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        managerId: data.managerId,
        workspaceId: manager.workspaceId,
        requiresPasswordChange: false, // Users who register themselves don't need to change password
      });
      await user.save();

      const token = this.generateToken(user);

      logger.info(
        `New user registered: ${user.email} with role ${user.role} in workspace: ${manager.workspaceId}`
      );

      return { user, token };
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Find user by email (email is unique within workspace, but not globally)
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

      // Get workspace info for CEO
      let workspace = null;
      if (user.role === "CEO") {
        workspace = await Workspace.findById(user.workspaceId);
      }

      logger.info(
        `User logged in: ${user.email} in workspace: ${user.workspaceId}`
      );

      return { user, token, workspace };
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
