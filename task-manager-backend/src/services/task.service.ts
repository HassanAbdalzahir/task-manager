import { Task, ITask, IComment } from "../models/task.model";
import { User, IUser } from "../models/user.model";
import { createError } from "../middleware/errorHandler";
import logger from "../utils/logger";

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
  async createTask(data: CreateTaskData, createdBy: string): Promise<ITask> {
    try {
      // Verify the creator exists
      const creator = await User.findById(createdBy);
      if (!creator) {
        throw createError("Creator not found", 404);
      }

      // Verify the assignee exists
      const assignee = await User.findById(data.assignedTo);
      if (!assignee) {
        throw createError("Assignee not found", 404);
      }

      // CEOs can assign tasks to anyone in their organization
      if (creator.role === "CEO") {
        const task = new Task({
          ...data,
          createdBy,
          status: "pending",
        });

        await task.save();

        logger.info(
          `Task created: ${task.title} by ${createdBy} for ${data.assignedTo}`
        );
        logger.info(
          `Task details: ID=${task._id}, AssignedTo=${task.assignedTo}, CreatedBy=${task.createdBy}`
        );

        return task;
      }

      // Check if creator can assign to this user (must be direct subordinate)
      const isDirectSubordinate = await User.exists({
        _id: data.assignedTo,
        managerId: createdBy,
      });

      if (!isDirectSubordinate) {
        throw createError(
          "You can only assign tasks to your direct subordinates",
          403
        );
      }

      const task = new Task({
        ...data,
        createdBy,
        status: "pending",
      });

      await task.save();

      logger.info(
        `Task created: ${task.title} by ${createdBy} for ${data.assignedTo}`
      );
      logger.info(
        `Task details: ID=${task._id}, AssignedTo=${task.assignedTo}, CreatedBy=${task.createdBy}`
      );

      return task;
    } catch (error) {
      logger.error("Error creating task:", error);
      throw error;
    }
  }

  async getTasksAssignedToUser(userId: string): Promise<ITask[]> {
    try {
      logger.info(`Looking for tasks assigned to user: ${userId}`);

      const tasks = await Task.find({ assignedTo: userId })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      logger.info(
        `Retrieved ${tasks.length} tasks assigned to user: ${userId}`
      );

      // Log each task for debugging
      tasks.forEach((task, index) => {
        logger.info(
          `Task ${index + 1}: ID=${task._id}, Title="${
            task.title
          }", AssignedTo=${task.assignedTo}, CreatedBy=${task.createdBy}`
        );
      });

      return tasks;
    } catch (error) {
      logger.error("Error getting tasks assigned to user:", error);
      throw error;
    }
  }

  async getTasksCreatedByUser(userId: string): Promise<ITask[]> {
    try {
      const tasks = await Task.find({ createdBy: userId })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      logger.info(`Retrieved ${tasks.length} tasks created by user: ${userId}`);
      return tasks;
    } catch (error) {
      logger.error("Error getting tasks created by user:", error);
      throw error;
    }
  }

  async getTasksForSubordinates(userId: string): Promise<ITask[]> {
    try {
      // Get all subordinates recursively
      const { userService } = await import("./user.service");
      const allSubordinates = await userService.getAllSubordinates(userId);
      const subordinateIds = allSubordinates.map((sub) => sub._id);

      const tasks = await Task.find({
        $or: [
          { assignedTo: { $in: subordinateIds } },
          { createdBy: { $in: subordinateIds } },
        ],
      })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      logger.info(
        `Retrieved ${tasks.length} tasks for subordinates of user: ${userId}`
      );
      return tasks;
    } catch (error) {
      logger.error("Error getting tasks for subordinates:", error);
      throw error;
    }
  }

  async getTaskById(taskId: string, userId: string): Promise<ITask> {
    try {
      const task = await Task.findById(taskId)
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role");

      if (!task) {
        throw createError("Task not found", 404);
      }

      // Get the current user to check their role
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // CEOs have access to all tasks in their organization
      if (currentUser.role === "CEO") {
        return task;
      }

      // Check if user has access to this task
      const hasAccess =
        task.assignedTo._id.toString() === userId ||
        task.createdBy._id.toString() === userId ||
        (await this.isUserManagerOf(task.assignedTo._id.toString(), userId));

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
    userId: string
  ): Promise<ITask> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Get the current user to check their role
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // CEOs can update any task's status
      if (currentUser.role === "CEO") {
        task.status = status as "pending" | "in_progress" | "completed";
        await task.save();

        logger.info(`Task status updated: ${taskId} to ${status} by ${userId}`);
        return task;
      }

      // Only the assignee can update task status
      if (task.assignedTo.toString() !== userId) {
        throw createError("Only the assigned user can update task status", 403);
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
    userId: string
  ): Promise<ITask> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Get the current user to check their role
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // CEOs can update any task and assign to anyone
      if (currentUser.role === "CEO") {
        const updatedTask = await Task.findByIdAndUpdate(taskId, data, {
          new: true,
          runValidators: true,
        })
          .populate("createdBy", "name email role")
          .populate("assignedTo", "name email role");

        logger.info(`Task updated: ${taskId} by ${userId}`);
        return updatedTask!;
      }

      // Only the creator can update task details
      if (task.createdBy.toString() !== userId) {
        throw createError("Only the task creator can update task details", 403);
      }

      // If changing assignee, verify it's a direct subordinate
      if (data.assignedTo && data.assignedTo !== task.assignedTo.toString()) {
        const isDirectSubordinate = await User.exists({
          _id: data.assignedTo,
          managerId: userId,
        });

        if (!isDirectSubordinate) {
          throw createError(
            "You can only assign tasks to your direct subordinates",
            403
          );
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
    userId: string
  ): Promise<ITask> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Get the current user to check their role
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // CEOs can comment on any task
      if (currentUser.role === "CEO") {
        const comment: IComment = {
          message: data.message,
          createdAt: new Date(),
          createdBy: userId as any,
        };

        task.comments.push(comment);
        await task.save();

        logger.info(`Comment added to task: ${taskId} by ${userId}`);
        return task;
      }

      // Only the assignee or creator can add comments
      if (
        task.assignedTo.toString() !== userId &&
        task.createdBy.toString() !== userId
      ) {
        throw createError("Access denied to add comments to this task", 403);
      }

      const comment: IComment = {
        message: data.message,
        createdAt: new Date(),
        createdBy: userId as any,
      };

      task.comments.push(comment);
      await task.save();

      logger.info(`Comment added to task: ${taskId} by ${userId}`);

      return task;
    } catch (error) {
      logger.error("Error adding comment:", error);
      throw error;
    }
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw createError("Task not found", 404);
      }

      // Get the current user to check their role
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw createError("User not found", 404);
      }

      // CEOs can delete any task
      if (currentUser.role === "CEO") {
        await Task.findByIdAndDelete(taskId);
        logger.info(`Task deleted: ${taskId} by ${userId}`);
        return;
      }

      // Only the creator can delete the task
      if (task.createdBy.toString() !== userId) {
        throw createError("Only the task creator can delete the task", 403);
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
    managerId: string
  ): Promise<boolean> {
    try {
      const subordinate = await User.findById(subordinateId);
      if (!subordinate) return false;

      // Check if the user is in the management chain
      let currentManagerId = subordinate.managerId;
      while (currentManagerId) {
        if (currentManagerId.toString() === managerId) {
          return true;
        }
        const manager = await User.findById(currentManagerId);
        if (!manager) break;
        currentManagerId = manager.managerId;
      }

      return false;
    } catch (error) {
      logger.error("Error checking management relationship:", error);
      return false;
    }
  }

  async getTasksByStatus(status: string, userId: string): Promise<ITask[]> {
    try {
      const tasks = await Task.find({
        assignedTo: userId,
        status: status as "pending" | "in_progress" | "completed",
      })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      logger.info(
        `Retrieved ${tasks.length} ${status} tasks for user: ${userId}`
      );
      return tasks;
    } catch (error) {
      logger.error("Error getting tasks by status:", error);
      throw error;
    }
  }

  async getOverdueTasks(userId: string): Promise<ITask[]> {
    try {
      const tasks = await Task.find({
        assignedTo: userId,
        status: { $ne: "completed" },
        deadline: { $lt: new Date() },
      })
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ deadline: 1 });

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
