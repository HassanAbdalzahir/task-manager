import { Workspace, IWorkspace } from "../models/workspace.model";
import { User } from "../models/user.model";
import { createError } from "../middleware/errorHandler";
import logger from "../utils/logger";

export class WorkspaceService {
  async createWorkspace(workspaceData: {
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<IWorkspace> {
    try {
      // Verify the creator is a CEO
      const creator = await User.findById(workspaceData.createdBy);
      if (!creator) {
        throw createError("Creator not found", 404);
      }
      if (creator.role !== "CEO") {
        throw createError("Only CEOs can create workspaces", 403);
      }

      const workspace = new Workspace(workspaceData);
      await workspace.save();

      logger.info(
        `Created workspace: ${workspace.name} by user: ${workspaceData.createdBy}`
      );
      return workspace;
    } catch (error) {
      logger.error("Error creating workspace:", error);
      throw error;
    }
  }

  async getWorkspaceById(workspaceId: string): Promise<IWorkspace> {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw createError("Workspace not found", 404);
      }

      return workspace;
    } catch (error) {
      logger.error("Error getting workspace by ID:", error);
      throw error;
    }
  }

  async getWorkspaceByCreator(createdBy: string): Promise<IWorkspace | null> {
    try {
      const workspace = await Workspace.findOne({ createdBy, isActive: true });
      return workspace;
    } catch (error) {
      logger.error("Error getting workspace by creator:", error);
      throw error;
    }
  }

  async updateWorkspace(
    workspaceId: string,
    updateData: Partial<IWorkspace>
  ): Promise<IWorkspace> {
    try {
      const workspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!workspace) {
        throw createError("Workspace not found", 404);
      }

      logger.info(`Updated workspace: ${workspaceId}`);
      return workspace;
    } catch (error) {
      logger.error("Error updating workspace:", error);
      throw error;
    }
  }

  async deactivateWorkspace(workspaceId: string): Promise<void> {
    try {
      const workspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        { isActive: false },
        { new: true }
      );

      if (!workspace) {
        throw createError("Workspace not found", 404);
      }

      logger.info(`Deactivated workspace: ${workspaceId}`);
    } catch (error) {
      logger.error("Error deactivating workspace:", error);
      throw error;
    }
  }

  async getWorkspaceUsers(workspaceId: string): Promise<any[]> {
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
      logger.error("Error getting workspace users:", error);
      throw error;
    }
  }
}

export const workspaceService = new WorkspaceService();
export default workspaceService;
