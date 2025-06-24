import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { IUser } from "../models/user.model";
import { asyncHandler } from "../middleware/errorHandler";
import logger from "../utils/logger";

export class UserController {
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
        user._id.toString()
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
        user._id.toString()
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
      const hierarchy = await userService.getUserHierarchy(user._id.toString());

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
          user._id.toString()
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

      const targetUser = await userService.getUserById(userId);

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

      const users = await userService.getAllUsers();

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
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

      const updatedUser = await userService.updateUser(userId, updateData);

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

      await userService.deleteUser(userId);

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

      const users = await userService.getUsersByRole(role);

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
          role,
        },
      });
    }
  );
}

export const userController = new UserController();
export default userController;
