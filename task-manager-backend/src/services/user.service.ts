import { User, IUser } from "../models/user.model";
import { createError } from "../middleware/errorHandler";
import logger from "../utils/logger";

export interface UserHierarchy {
  user: IUser;
  directSubordinates: IUser[];
  allSubordinates: IUser[];
}

export class UserService {
  async getDirectSubordinates(userId: string): Promise<IUser[]> {
    try {
      const subordinates = await User.find({ managerId: userId })
        .select("-password")
        .sort({ name: 1 });

      logger.info(
        `Retrieved ${subordinates.length} direct subordinates for user: ${userId}`
      );
      return subordinates;
    } catch (error) {
      logger.error("Error getting direct subordinates:", error);
      throw error;
    }
  }

  async getAllSubordinates(userId: string): Promise<IUser[]> {
    try {
      // Recursive function to get all subordinates
      const getAllSubordinatesRecursive = async (
        managerId: string
      ): Promise<IUser[]> => {
        const directSubordinates = await User.find({ managerId })
          .select("-password")
          .sort({ name: 1 });

        let allSubordinates: IUser[] = [];

        for (const subordinate of directSubordinates) {
          allSubordinates.push(subordinate.toObject());
          const nestedSubordinates = await getAllSubordinatesRecursive(
            subordinate._id.toString()
          );
          allSubordinates = [...allSubordinates, ...nestedSubordinates];
        }

        return allSubordinates;
      };

      const allSubordinates = await getAllSubordinatesRecursive(userId);

      logger.info(
        `Retrieved ${allSubordinates.length} total subordinates for user: ${userId}`
      );
      return allSubordinates;
    } catch (error) {
      logger.error("Error getting all subordinates:", error);
      throw error;
    }
  }

  async getUserHierarchy(userId: string): Promise<UserHierarchy> {
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        throw createError("User not found", 404);
      }

      const directSubordinates = await this.getDirectSubordinates(userId);
      const allSubordinates = await this.getAllSubordinates(userId);

      const hierarchy: UserHierarchy = {
        user,
        directSubordinates,
        allSubordinates,
      };

      logger.info(`Retrieved hierarchy for user: ${userId}`);
      return hierarchy;
    } catch (error) {
      logger.error("Error getting user hierarchy:", error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        throw createError("User not found", 404);
      }

      return user;
    } catch (error) {
      logger.error("Error getting user by ID:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await User.find()
        .select("-password")
        .populate("managerId", "name email role")
        .sort({ role: 1, name: 1 });

      logger.info(`Retrieved ${users.length} users`);
      return users;
    } catch (error) {
      logger.error("Error getting all users:", error);
      throw error;
    }
  }

  async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        throw createError("User not found", 404);
      }

      logger.info(`Updated user: ${userId}`);
      return user;
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Check if user has subordinates
      const hasSubordinates = await User.exists({ managerId: userId });
      if (hasSubordinates) {
        throw createError(
          "Cannot delete user with subordinates. Reassign subordinates first.",
          400
        );
      }

      // Check if user has assigned tasks
      const { Task } = await import("../models/task.model");
      const hasTasks = await Task.exists({
        $or: [{ assignedTo: userId }, { createdBy: userId }],
      });

      if (hasTasks) {
        throw createError(
          "Cannot delete user with assigned tasks. Reassign tasks first.",
          400
        );
      }

      const result = await User.findByIdAndDelete(userId);
      if (!result) {
        throw createError("User not found", 404);
      }

      logger.info(`Deleted user: ${userId}`);
    } catch (error) {
      logger.error("Error deleting user:", error);
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<IUser[]> {
    try {
      const users = await User.find({ role })
        .select("-password")
        .populate("managerId", "name email role")
        .sort({ name: 1 });

      logger.info(`Retrieved ${users.length} users with role: ${role}`);
      return users;
    } catch (error) {
      logger.error("Error getting users by role:", error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
