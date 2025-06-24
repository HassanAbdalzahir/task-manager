import { Request, Response, NextFunction } from "express";
import {
  taskService,
  CreateTaskData,
  UpdateTaskData,
  AddCommentData,
} from "../services/task.service";
import { IUser } from "../models/user.model";
import { asyncHandler } from "../middleware/errorHandler";
import logger from "../utils/logger";

export class TaskController {
  createTask = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const { title, description, assignedTo, deadline }: CreateTaskData =
        req.body;

      // Validate required fields
      if (!title || !description || !assignedTo) {
        res.status(400).json({
          success: false,
          message: "Title, description, and assignedTo are required",
        });
        return;
      }

      const task = await taskService.createTask(
        {
          title,
          description,
          assignedTo,
          deadline: deadline ? new Date(deadline) : undefined,
        },
        user._id.toString()
      );

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: {
          task,
        },
      });
    }
  );

  getTasksAssignedToMe = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const tasks = await taskService.getTasksAssignedToUser(
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          tasks,
          count: tasks.length,
        },
      });
    }
  );

  getTasksCreatedByMe = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const tasks = await taskService.getTasksCreatedByUser(
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          tasks,
          count: tasks.length,
        },
      });
    }
  );

  getTasksForSubordinates = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const tasks = await taskService.getTasksForSubordinates(
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          tasks,
          count: tasks.length,
        },
      });
    }
  );

  getTaskById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { taskId } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const task = await taskService.getTaskById(taskId, user._id.toString());

      res.status(200).json({
        success: true,
        data: {
          task,
        },
      });
    }
  );

  updateTaskStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { taskId } = req.params;
      const { status } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (
        !status ||
        !["pending", "in_progress", "completed"].includes(status)
      ) {
        res.status(400).json({
          success: false,
          message: "Valid status is required (pending, in_progress, completed)",
        });
        return;
      }

      const user = req.user as IUser;
      const task = await taskService.updateTaskStatus(
        taskId,
        status,
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        message: "Task status updated successfully",
        data: {
          task,
        },
      });
    }
  );

  updateTask = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { taskId } = req.params;
      const updateData: UpdateTaskData = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const task = await taskService.updateTask(
        taskId,
        updateData,
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: {
          task,
        },
      });
    }
  );

  addComment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { taskId } = req.params;
      const { message }: AddCommentData = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!message || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: "Comment message is required",
        });
        return;
      }

      const user = req.user as IUser;
      const task = await taskService.addComment(
        taskId,
        { message },
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        message: "Comment added successfully",
        data: {
          task,
        },
      });
    }
  );

  deleteTask = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { taskId } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      await taskService.deleteTask(taskId, user._id.toString());

      res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    }
  );

  getTasksByStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { status } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!["pending", "in_progress", "completed"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Valid status is required (pending, in_progress, completed)",
        });
        return;
      }

      const user = req.user as IUser;
      const tasks = await taskService.getTasksByStatus(
        status,
        user._id.toString()
      );

      res.status(200).json({
        success: true,
        data: {
          tasks,
          count: tasks.length,
          status,
        },
      });
    }
  );

  getOverdueTasks = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = req.user as IUser;
      const tasks = await taskService.getOverdueTasks(user._id.toString());

      res.status(200).json({
        success: true,
        data: {
          tasks,
          count: tasks.length,
        },
      });
    }
  );
}

export const taskController = new TaskController();
export default taskController;
