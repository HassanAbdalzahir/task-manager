import { Task, ITask, IComment } from "../models/task.model";
import { User, IUser } from "../models/user.model";
import { createError } from "../middleware/errorHandler";
import logger from "../utils/logger";
import mongoose from "mongoose";

export interface CreateTaskData {
  title: string;
  description: string;
  assignedTo: string;
  deadline?: Date;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  deadline?: Date;
  assignedTo?: string;
}

export interface AddCommentData {
  message: string;
}

export class TaskService {
  async createTask(
    data: CreateTaskData,
    createdBy: string,
    workspaceId: string
  ): Promise<ITask> {
    try {
      // Verify the creator exists and belongs to the workspace
      const creator = await User.findById(createdBy);
      if (!creator) {
        throw createError("Creator not found", 404);
      }
      if (creator.workspaceId.toString() !== workspaceId) {
        throw createError("Creator does not belong to this workspace", 403);
      }

      // Verify the assignee exists and belongs to the workspace
      const assignee = await User.findById(data.assignedTo);
      if (!assignee) {
        throw createError("Assignee not found", 404);
      }
      if (assignee.workspaceId.toString() !== workspaceId) {
        throw createError("Assignee does not belong to this workspace", 403);
      }

      // CEOs can assign tasks to anyone in their workspace
      if (creator.role === "CEO") {
        const task = new Task({
          ...data,
          createdBy,
          workspaceId,
          status: "pending",
        });

        await task.save();

        logger.info(
          `Task created: ${task.title} by ${createdBy} for ${data.assignedTo} in workspace: ${workspaceId}`
        );

        return task;
      }

      // Managers can assign tasks to their direct subordinates
      if (creator.role === "Manager") {
        const isDirectSubordinate = await User.exists({
          _id: data.assignedTo,
          managerId: createdBy,
          workspaceId,
        });

        if (!isDirectSubordinate) {
          throw createError(
            "You can only assign tasks to your direct subordinates",
            403
          );
        }
      }

      // Employees cannot assign tasks
      if (creator.role === "Employee") {
        throw createError("Employees cannot assign tasks", 403);
      }

      const task = new Task({
        ...data,
        createdBy,
        workspaceId,
        status: "pending",
      });

      await task.save();

      logger.info(
        `Task created: ${task.title} by ${createdBy} for ${data.assignedTo} in workspace: ${workspaceId}`
      );

      return task;
    } catch (error) {
      logger.error("Error creating task:", error);
      throw error;
    }
  }

  async getTasksAssignedToUser(
    userId: string,
    workspaceId: string
  ): Promise<ITask[]> {
    try {
      logger.info(
        `Looking for tasks assigned to user: ${userId} in workspace: ${workspaceId}`
      );

      const tasks = await Task.find({
        assignedTo: userId,
        workspaceId,
      })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      logger.info(
        `Retrieved ${tasks.length} tasks assigned to user: ${userId} in workspace: ${workspaceId}`
      );

      return tasks;
    } catch (error) {
      logger.error("Error getting tasks assigned to user:", error);
      throw error;
    }
  }

  async getTasksCreatedByUser(
    userId: string,
    workspaceId: string
  ): Promise<ITask[]> {
    try {
      const tasks = await Task.find({
        createdBy: userId,
        workspaceId,
      })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      logger.info(
        `Retrieved ${tasks.length} tasks created by user: ${userId} in workspace: ${workspaceId}`
      );
      return tasks;
    } catch (error) {
      logger.error("Error getting tasks created by user:", error);
      throw error;
    }
  }

  async getTasksForSubordinates(
    userId: string,
    workspaceId: string
  ): Promise<ITask[]> {
    try {
      // Get all subordinates recursively
      const { userService } = await import("./user.service");
      const allSubordinates = await userService.getAllSubordinates(
        userId,
        workspaceId
      );
      const subordinateIds = allSubordinates.map((sub) => sub._id);

      const tasks = await Task.find({
        $or: [
          { assignedTo: { $in: subordinateIds } },
          { createdBy: { $in: subordinateIds } },
        ],
        workspaceId,
      })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      logger.info(
        `Retrieved ${tasks.length} tasks for subordinates of user: ${userId} in workspace: ${workspaceId}`
      );
      return tasks;
    } catch (error) {
      logger.error("Error getting tasks for subordinates:", error);
      throw error;
    }
  }

  async getTaskById(
    taskId: string,
    userId: string,
    workspaceId: string
  ): Promise<ITask> {
    try {
      const task = await Task.findById(taskId)
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      if (!task) {
        throw createError("Task not found", 404);
      }

      // Verify task belongs to the workspace
      if (task.workspaceId.toString() !== workspaceId) {
        throw createError("Task does not belong to this workspace", 403);
      }

      // Get the current user to check their role
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (currentUser.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      // CEOs have access to all tasks in their workspace
      if (currentUser.role === "CEO") {
        return task;
      }

      // Check if user has access to this task
      const hasAccess =
        task.assignedTo._id.toString() === userId ||
        task.createdBy._id.toString() === userId ||
        (await this.isUserManagerOf(
          task.assignedTo._id.toString(),
          userId,
          workspaceId
        ));

      if (!hasAccess) {
        throw createError("Access denied to this task", 403);
      }

      return task;
    } catch (error) {
      logger.error("Error getting task by ID:", error);
      throw error;
    }
  }

  async updateTaskStatus(
    taskId: string,
    status: string,
    userId: string,
    workspaceId: string
  ): Promise<ITask> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Verify task belongs to the workspace
      if (task.workspaceId.toString() !== workspaceId) {
        throw createError("Task does not belong to this workspace", 403);
      }

      // Get the current user
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (currentUser.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      // Only the assigned user or their manager can update task status
      const canUpdate =
        task.assignedTo.toString() === userId ||
        task.createdBy.toString() === userId ||
        (await this.isUserManagerOf(
          task.assignedTo.toString(),
          userId,
          workspaceId
        ));

      if (!canUpdate) {
        throw createError(
          "You can only update tasks assigned to you or your subordinates",
          403
        );
      }

      task.status = status as "pending" | "in_progress" | "completed";
      await task.save();

      logger.info(`Task status updated: ${taskId} to ${status} by ${userId}`);
      return task;
    } catch (error) {
      logger.error("Error updating task status:", error);
      throw error;
    }
  }

  async updateTask(
    taskId: string,
    data: UpdateTaskData,
    userId: string,
    workspaceId: string
  ): Promise<ITask> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Verify task belongs to the workspace
      if (task.workspaceId.toString() !== workspaceId) {
        throw createError("Task does not belong to this workspace", 403);
      }

      // Get the current user
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (currentUser.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      // Only the creator or CEO can update task details
      const canUpdate =
        task.createdBy.toString() === userId || currentUser.role === "CEO";

      if (!canUpdate) {
        throw createError("You can only update tasks you created", 403);
      }

      // If reassigning, verify the new assignee exists and belongs to the workspace
      if (data.assignedTo) {
        const newAssignee = await User.findById(data.assignedTo);
        if (!newAssignee) {
          throw createError("New assignee not found", 404);
        }
        if (newAssignee.workspaceId.toString() !== workspaceId) {
          throw createError(
            "New assignee does not belong to this workspace",
            403
          );
        }

        // Managers can only reassign to their subordinates
        if (currentUser.role === "Manager") {
          const isSubordinate = await User.exists({
            _id: data.assignedTo,
            managerId: userId,
            workspaceId,
          });

          if (!isSubordinate) {
            throw createError(
              "You can only reassign tasks to your subordinates",
              403
            );
          }
        }
      }

      const updatedTask = await Task.findByIdAndUpdate(taskId, data, {
        new: true,
        runValidators: true,
      })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      logger.info(`Task updated: ${taskId} by ${userId}`);
      return updatedTask!;
    } catch (error) {
      logger.error("Error updating task:", error);
      throw error;
    }
  }

  async addComment(
    taskId: string,
    data: AddCommentData,
    userId: string,
    workspaceId: string
  ): Promise<ITask> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Verify task belongs to the workspace
      if (task.workspaceId.toString() !== workspaceId) {
        throw createError("Task does not belong to this workspace", 403);
      }

      // Get the current user
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (currentUser.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      // Check if user has access to this task
      const hasAccess =
        task.assignedTo.toString() === userId ||
        task.createdBy.toString() === userId ||
        (await this.isUserManagerOf(
          task.assignedTo.toString(),
          userId,
          workspaceId
        ));

      if (!hasAccess) {
        throw createError("Access denied to this task", 403);
      }

      const comment: IComment = {
        message: data.message,
        createdAt: new Date(),
        createdBy: currentUser._id as mongoose.Types.ObjectId,
      };

      task.comments.push(comment);
      await task.save();

      const populatedTask = await Task.findById(taskId)
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      logger.info(`Comment added to task: ${taskId} by ${userId}`);
      return populatedTask!;
    } catch (error) {
      logger.error("Error adding comment:", error);
      throw error;
    }
  }

  async deleteTask(
    taskId: string,
    userId: string,
    workspaceId: string
  ): Promise<void> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Verify task belongs to the workspace
      if (task.workspaceId.toString() !== workspaceId) {
        throw createError("Task does not belong to this workspace", 403);
      }

      // Get the current user
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (currentUser.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      // Only the creator or CEO can delete tasks
      const canDelete =
        task.createdBy.toString() === userId || currentUser.role === "CEO";

      if (!canDelete) {
        throw createError("You can only delete tasks you created", 403);
      }

      await Task.findByIdAndDelete(taskId);

      logger.info(`Task deleted: ${taskId} by ${userId}`);
    } catch (error) {
      logger.error("Error deleting task:", error);
      throw error;
    }
  }

  private async isUserManagerOf(
    subordinateId: string,
    managerId: string,
    workspaceId: string
  ): Promise<boolean> {
    try {
      const subordinate = await User.findById(subordinateId);
      if (!subordinate) {
        return false;
      }

      // Verify both users belong to the same workspace
      if (subordinate.workspaceId.toString() !== workspaceId) {
        return false;
      }

      // Check if the manager is directly above the subordinate
      if (subordinate.managerId?.toString() === managerId) {
        return true;
      }

      // Check if the manager is higher up in the hierarchy
      if (subordinate.managerId) {
        return await this.isUserManagerOf(
          subordinate.managerId.toString(),
          managerId,
          workspaceId
        );
      }

      return false;
    } catch (error) {
      logger.error("Error checking manager relationship:", error);
      return false;
    }
  }

  async getTasksByStatus(
    status: string,
    userId: string,
    workspaceId: string
  ): Promise<ITask[]> {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (currentUser.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      let tasks: ITask[];

      if (currentUser.role === "CEO") {
        // CEOs can see all tasks in their workspace
        tasks = await Task.find({ status, workspaceId })
          .populate("createdBy", "name email role")
          .populate("assignedTo", "name email role")
          .sort({ createdAt: -1 });
      } else {
        // Others can only see tasks they're involved with
        tasks = await Task.find({
          status,
          workspaceId,
          $or: [{ assignedTo: userId }, { createdBy: userId }],
        })
          .populate("createdBy", "name email role")
          .populate("assignedTo", "name email role")
          .sort({ createdAt: -1 });
      }

      logger.info(
        `Retrieved ${tasks.length} tasks with status: ${status} for user: ${userId}`
      );
      return tasks;
    } catch (error) {
      logger.error("Error getting tasks by status:", error);
      throw error;
    }
  }

  async getOverdueTasks(userId: string, workspaceId: string): Promise<ITask[]> {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // Verify user belongs to the workspace
      if (currentUser.workspaceId.toString() !== workspaceId) {
        throw createError("User does not belong to this workspace", 403);
      }

      const now = new Date();
      let tasks: ITask[];

      if (currentUser.role === "CEO") {
        // CEOs can see all overdue tasks in their workspace
        tasks = await Task.find({
          workspaceId,
          deadline: { $lt: now },
          status: { $ne: "completed" },
        })
          .populate("createdBy", "name email role")
          .populate("assignedTo", "name email role")
          .sort({ deadline: 1 });
      } else {
        // Others can only see overdue tasks they're involved with
        tasks = await Task.find({
          workspaceId,
          deadline: { $lt: now },
          status: { $ne: "completed" },
          $or: [{ assignedTo: userId }, { createdBy: userId }],
        })
          .populate("createdBy", "name email role")
          .populate("assignedTo", "name email role")
          .sort({ deadline: 1 });
      }

      logger.info(
        `Retrieved ${tasks.length} overdue tasks for user: ${userId}`
      );
      return tasks;
    } catch (error) {
      logger.error("Error getting overdue tasks:", error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
export default taskService;
