import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { IUser } from "../models/user.model";
import { asyncHandler } from "../middleware/errorHandler";
import logger from "../utils/logger";

export class UserController {
  createUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const currentUser = req.user as IUser;
      const { name, email, password, role, managerId } = req.body;

      // Validate required fields
      if (!name || !email || !password || !role) {
        res.status(400).json({
          success: false,
          message: "Name, email, password, and role are required",
        });
        return;
      }

      // Only CEO and Managers can create users
      if (currentUser.role === "Employee") {
        res.status(403).json({
          success: false,
          message: "Employees cannot create users",
        });
        return;
      }

      // Managers can only create Employees
      if (currentUser.role === "Manager" && role !== "Employee") {
        res.status(403).json({
          success: false,
          message: "Managers can only create Employee accounts",
        });
        return;
      }

      const newUser = await userService.createUser(
        { name, email, password, role, managerId },
        currentUser.workspaceId.toString(),
        currentUser._id.toString()
      );

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          user: newUser,
        },
      });
    }
  );

  getDirectSubordinates = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const subordinates = await userService.getDirectSubordinates(
        user._id.toString(),
        user.workspaceId.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          subordinates,
          count: subordinates.length,
        },
      });
    }
  );

  getAllSubordinates = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const subordinates = await userService.getAllSubordinates(
        user._id.toString(),
        user.workspaceId.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          subordinates,
          count: subordinates.length,
        },
      });
    }
  );

  getUserHierarchy = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const hierarchy = await userService.getUserHierarchy(
        user._id.toString(),
        user.workspaceId.toString()
      );

      res.status(200).json({
        success: true,
        data: hierarchy,
      });
    }
  );

  getUserById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { userId } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;

      // Users can only view their own profile or their subordinates
      if (userId !== user._id.toString()) {
        const allSubordinates = await userService.getAllSubordinates(
          user._id.toString(),
          user.workspaceId.toString()
        );
        const isSubordinate = allSubordinates.some(
          (sub) => sub._id.toString() === userId
        );

        if (!isSubordinate) {
          res.status(403).json({
            success: false,
            message: "Access denied",
          });
          return;
        }
      }

      const targetUser = await userService.getUserById(
        userId,
        user.workspaceId.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          user: targetUser,
        },
      });
    }
  );

  getAllUsers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;

      // Only CEO and Managers can view all users
      if (user.role === "Employee") {
        res.status(403).json({
          success: false,
          message: "Access denied. Only managers can view all users.",
        });
        return;
      }

      const users = await userService.getAllUsers(user.workspaceId.toString());

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
        },
      });
    }
  );

  getAvailableManagers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const { excludeUserId } = req.query;

      const managers = await userService.getAvailableManagers(
        user.workspaceId.toString(),
        excludeUserId as string,
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          managers,
          count: managers.length,
        },
      });
    }
  );

  updateUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { userId } = req.params;
      const updateData = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;

      // Users can only update their own profile
      if (userId !== user._id.toString()) {
        res.status(403).json({
          success: false,
          message: "You can only update your own profile",
        });
        return;
      }

      // Prevent role and manager updates through this endpoint
      delete updateData.role;
      delete updateData.managerId;

      const updatedUser = await userService.updateUser(
        userId,
        updateData,
        user.workspaceId.toString()
      );

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: {
          user: updatedUser,
        },
      });
    }
  );

  deleteUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { userId } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;

      // Only CEO can delete users
      if (user.role !== "CEO") {
        res.status(403).json({
          success: false,
          message: "Only CEO can delete users",
        });
        return;
      }

      // CEO cannot delete themselves
      if (userId === user._id.toString()) {
        res.status(400).json({
          success: false,
          message: "CEO cannot delete their own account",
        });
        return;
      }

      await userService.deleteUser(userId, user.workspaceId.toString());

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    }
  );

  getUsersByRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { role } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;

      // Only CEO and Managers can view users by role
      if (user.role === "Employee") {
        res.status(403).json({
          success: false,
          message: "Access denied. Only managers can view users by role.",
        });
        return;
      }

      const users = await userService.getUsersByRole(
        role,
        user.workspaceId.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
        },
      });
    }
  );

  changePassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
        return;
      }

      // Validate new password length
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
        return;
      }

      const updatedUser = await userService.changePassword(
        user._id.toString(),
        currentPassword,
        newPassword,
        user.workspaceId.toString()
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
        data: {
          user: updatedUser,
        },
      });
    }
  );
}

export const userController = new UserController();
export default userController;
