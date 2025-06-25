import { Server } from "socket.io";
import { ITask } from "../models/task.model";
import { User } from "../models/user.model";
import logger from "../utils/logger";

// Task assigned notification - PERSISTENT (won't auto-dismiss)
export const notifyTaskAssigned = (
  io: Server,
  task: ITask,
  assignedToId: string
): void => {
  try {
    io.to(assignedToId).emit("task:assigned", {
      type: "task:assigned",
      data: {
        taskId: task._id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        createdAt: task.createdAt,
      },
      message: `New task assigned: ${task.title}`,
      isPersistent: true, // This notification won't auto-dismiss
    });

    logger.info(`Task assigned notification sent to user: ${assignedToId}`);
  } catch (error) {
    logger.error("Error sending task assigned notification:", error);
  }
};

// Task status updated notification
export const notifyTaskUpdated = (
  io: Server,
  task: ITask,
  userIds: string[]
): void => {
  try {
    const notification = {
      type: "task:updated",
      data: {
        taskId: task._id,
        title: task.title,
        status: task.status,
        updatedAt: task.updatedAt,
      },
      message: `Task "${task.title}" status updated to ${task.status}`,
    };

    // Send to all relevant users
    userIds.forEach((userId) => {
      io.to(userId).emit("task:updated", notification);
    });

    logger.info(
      `Task updated notification sent to users: ${userIds.join(", ")}`
    );
  } catch (error) {
    logger.error("Error sending task updated notification:", error);
  }
};

// Task completed notification
export const notifyTaskCompleted = (
  io: Server,
  task: ITask,
  createdById: string
): void => {
  try {
    io.to(createdById).emit("task:completed", {
      type: "task:completed",
      data: {
        taskId: task._id,
        title: task.title,
        completedAt: task.updatedAt,
      },
      message: `Task "${task.title}" has been completed`,
    });

    logger.info(`Task completed notification sent to creator: ${createdById}`);
  } catch (error) {
    logger.error("Error sending task completed notification:", error);
  }
};

// Task status change notification to manager
export const notifyManagerOfStatusChange = async (
  io: Server,
  task: ITask,
  status: string,
  updatedByUserId: string
): Promise<void> => {
  try {
    // Get the task assignee to find their manager
    const assignee = await User.findById(task.assignedTo);
    if (!assignee || !assignee.managerId) {
      return; // No manager to notify
    }

    // Get the user who updated the status
    const updatedByUser = await User.findById(updatedByUserId);
    if (!updatedByUser) {
      return;
    }

    // Only notify if the assignee updated their own task status
    if (task.assignedTo.toString() === updatedByUserId) {
      const statusText = status === "in_progress" ? "in progress" : status;

      io.to(assignee.managerId.toString()).emit("task:status_changed", {
        type: "task:status_changed",
        data: {
          taskId: task._id,
          title: task.title,
          status: status,
          updatedBy: updatedByUser.name,
          updatedAt: task.updatedAt,
        },
        message: `${updatedByUser.name} marked task "${task.title}" as ${statusText}`,
      });

      logger.info(
        `Task status change notification sent to manager: ${assignee.managerId}`
      );
    }
  } catch (error) {
    logger.error("Error sending manager status change notification:", error);
  }
};

// Task deadline approaching notification
export const notifyTaskDeadline = (
  io: Server,
  task: ITask,
  assignedToId: string
): void => {
  try {
    const isOverdue =
      task.deadline &&
      task.status !== "completed" &&
      new Date() > task.deadline;

    io.to(assignedToId).emit("task:deadline", {
      type: "task:deadline",
      data: {
        taskId: task._id,
        title: task.title,
        deadline: task.deadline,
        isOverdue,
      },
      message: isOverdue
        ? `Task "${task.title}" is overdue!`
        : `Task "${task.title}" deadline is approaching`,
    });

    logger.info(`Task deadline notification sent to user: ${assignedToId}`);
  } catch (error) {
    logger.error("Error sending task deadline notification:", error);
  }
};

// User created notification
export const notifyUserCreated = (
  io: Server,
  user: any,
  workspaceId: string
): void => {
  try {
    // Send to all users in the workspace
    io.to(workspaceId).emit("user:created", {
      type: "user:created",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
      message: `New user created: ${user.name}`,
    });

    logger.info(`User created notification sent to workspace: ${workspaceId}`);
  } catch (error) {
    logger.error("Error sending user created notification:", error);
  }
};

export const setupTaskSockets = (io: Server): void => {
  // This function can be used to set up any additional socket event listeners
  // For now, we're exporting individual notification functions
  logger.info("Task socket handlers initialized");
};

export default setupTaskSockets;
