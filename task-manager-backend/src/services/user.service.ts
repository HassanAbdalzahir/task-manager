import { User, IUser } from "../models/user.model";
import { createError } from "../middleware/errorHandler";
import logger from "../utils/logger";

export interface UserHierarchy {
  user: IUser;
  directSubordinates: IUser[];
  allSubordinates: IUser[];
}

export class UserService {
  async getDirectSubordinates(
    userId: string,
    workspaceId: string
  ): Promise<IUser[]> {
    try {
      const subordinates = await User.find({
        managerId: userId,
        workspaceId: workspaceId,
      })
        .select("-password")
        .sort({ name: 1 });

      logger.info(
        `Retrieved ${subordinates.length} direct subordinates for user: ${userId} in workspace: ${workspaceId}`
      );
      return subordinates;
    } catch (error) {
      logger.error("Error getting direct subordinates:", error);
      throw error;
    }
  }

  async getAllSubordinates(
    userId: string,
    workspaceId: string
  ): Promise<IUser[]> {
    try {
      // Recursive function to get all subordinates
      const getAllSubordinatesRecursive = async (
        managerId: string
      ): Promise<IUser[]> => {
        const directSubordinates = await User.find({
          managerId,
          workspaceId: workspaceId,
        })
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
        `Retrieved ${allSubordinates.length} total subordinates for user: ${userId} in workspace: ${workspaceId}`
      );
      return allSubordinates;
    } catch (error) {
      logger.error("Error getting all subordinates:", error);
      throw error;
    }
  }

  async getUserHierarchy(
    userId: string,
    workspaceId: string
  ): Promise<UserHierarchy> {
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (user.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      const directSubordinates = await this.getDirectSubordinates(
        userId,
        workspaceId
      );
      const allSubordinates = await this.getAllSubordinates(
        userId,
        workspaceId
      );

      const hierarchy: UserHierarchy = {
        user,
        directSubordinates,
        allSubordinates,
      };

      logger.info(
        `Retrieved hierarchy for user: ${userId} in workspace: ${workspaceId}`
      );
      return hierarchy;
    } catch (error) {
      logger.error("Error getting user hierarchy:", error);
      throw error;
    }
  }

  async getUserById(userId: string, workspaceId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId).select("-password");
      if (!user) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (user.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      return user;
    } catch (error) {
      logger.error("Error getting user by ID:", error);
      throw error;
    }
  }

  async getAllUsers(workspaceId: string): Promise<IUser[]> {
    try {
      const users = await User.find({ workspaceId })
        .select("-password")
        .populate("managerId", "name email role")
        .sort({ role: 1, name: 1 });

      logger.info(
        `Retrieved ${users.length} users for workspace: ${workspaceId}`
      );
      return users;
    } catch (error) {
      logger.error("Error getting all users:", error);
      throw error;
    }
  }

  async createUser(
    userData: Partial<IUser>,
    workspaceId: string,
    createdBy: string
  ): Promise<IUser> {
    try {
      // Verify the creator has permission
      const creator = await User.findById(createdBy);
      if (!creator) {
        throw createError("Creator not found", 404);
      }

      if (creator.workspaceId.toString() !== workspaceId) {
        throw createError("Creator does not belong to this workspace", 403);
      }

      // CEOs can create any role, Managers can only create Employees
      if (creator.role === "Manager" && userData.role !== "Employee") {
        throw createError("Managers can only create Employee accounts", 403);
      }

      // If creating a Manager or Employee, verify the manager exists and belongs to the workspace
      if (userData.role !== "CEO" && userData.managerId) {
        const manager = await User.findById(userData.managerId);
        if (!manager) {
          throw createError("Manager not found", 404);
        }
        if (manager.workspaceId.toString() !== workspaceId) {
          throw createError("Manager does not belong to this workspace", 403);
        }

        // For Managers creating users, verify they can assign to the specified manager
        if (creator.role === "Manager") {
          const creatorSubordinates = await this.getDirectSubordinates(
            createdBy,
            workspaceId
          );
          const canAssignToManager =
            creatorSubordinates.some(
              (sub) => sub._id.toString() === String(userData.managerId)
            ) || String(userData.managerId) === String(createdBy);

          if (!canAssignToManager) {
            throw createError(
              "You can only assign users to your subordinates or yourself",
              403
            );
          }
        }
      }

      const user = new User({
        ...userData,
        workspaceId,
      });
      await user.save();

      logger.info(`Created user: ${user.email} in workspace: ${workspaceId}`);
      return user;
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    updateData: Partial<IUser>,
    workspaceId: string
  ): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        throw createError("User not found", 404);
      }

      if (user.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      logger.info(`Updated user: ${userId} in workspace: ${workspaceId}`);
      return user;
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  async deleteUser(userId: string, workspaceId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw createError("User not found", 404);
      }

      if (user.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      // Check if user has subordinates
      const hasSubordinates = await User.exists({
        managerId: userId,
        workspaceId,
      });
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
        workspaceId,
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

      logger.info(`Deleted user: ${userId} from workspace: ${workspaceId}`);
    } catch (error) {
      logger.error("Error deleting user:", error);
      throw error;
    }
  }

  async getUsersByRole(role: string, workspaceId: string): Promise<IUser[]> {
    try {
      const users = await User.find({ role, workspaceId })
        .select("-password")
        .populate("managerId", "name email role")
        .sort({ name: 1 });

      logger.info(
        `Retrieved ${users.length} users with role: ${role} in workspace: ${workspaceId}`
      );
      return users;
    } catch (error) {
      logger.error("Error getting users by role:", error);
      throw error;
    }
  }

  async getAvailableManagers(
    workspaceId: string,
    excludeUserId?: string,
    currentUserId?: string
  ): Promise<IUser[]> {
    try {
      console.log(`🔍 getAvailableManagers called with:`, {
        workspaceId,
        excludeUserId,
        currentUserId,
      });
      let managers: IUser[] = [];

      if (currentUserId) {
        const currentUser = await User.findById(currentUserId);
        console.log(
          `🔍 Current user:`,
          currentUser
            ? {
                id: currentUser._id,
                name: currentUser.name,
                role: currentUser.role,
              }
            : "NOT FOUND"
        );

        if (!currentUser) {
          throw createError("Current user not found", 404);
        }

        if (currentUser.role === "CEO") {
          console.log(`🔍 User is CEO, querying managers...`);
          const query: any = { workspaceId, role: { $in: ["CEO", "Manager"] } };
          if (excludeUserId) query._id = { $ne: excludeUserId };

          managers = await User.find(query)
            .select("-password")
            .sort({ role: 1, name: 1 });
          console.log(`🔍 Found ${managers.length} managers`);

          if (
            !managers.some(
              (m) => m._id.toString() === currentUser._id.toString()
            )
          ) {
            managers.unshift(currentUser);
            console.log(`🔍 Added CEO to list`);
          }
        } else if (currentUser.role === "Manager") {
          console.log(`🔍 User is Manager, querying subordinates...`);
          const query: any = {
            workspaceId,
            $or: [{ _id: currentUserId }, { managerId: currentUserId }],
          };
          if (excludeUserId) query._id = { $ne: excludeUserId };

          managers = await User.find(query)
            .select("-password")
            .sort({ role: 1, name: 1 });
          console.log(`🔍 Found ${managers.length} managers`);

          if (
            !managers.some(
              (m) => m._id.toString() === currentUser._id.toString()
            )
          ) {
            managers.unshift(currentUser);
            console.log(`🔍 Added Manager to list`);
          }
        } else {
          console.log(`🔍 User is Employee, returning empty list`);
          return [];
        }
      } else {
        console.log(`🔍 No currentUserId, using fallback`);
        const query: any = { workspaceId, role: { $in: ["CEO", "Manager"] } };
        if (excludeUserId) query._id = { $ne: excludeUserId };
        managers = await User.find(query)
          .select("-password")
          .sort({ role: 1, name: 1 });
      }

      console.log(`🔍 Returning ${managers.length} managers`);
      return managers;
    } catch (error) {
      console.error(`🔍 Error in getAvailableManagers:`, error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
