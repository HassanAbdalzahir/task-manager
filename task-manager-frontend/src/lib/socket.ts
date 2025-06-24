import { io, Socket } from "socket.io-client";
import { useNotificationStore } from "@/store/notificationStore";

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER!, {
    path: process.env.NEXT_PUBLIC_SOCKET_PATH,
    auth: {
      token,
    },
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("Connected to Socket.io server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Socket.io server");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  // Task-related events
  socket.on("task:assigned", (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: "info",
      title: "New Task Assigned",
      message: `You have been assigned: "${data.task.title}"`,
      duration: 6000,
    });
  });

  socket.on("task:updated", (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: "success",
      title: "Task Updated",
      message: `Task "${data.task.title}" status changed to ${data.task.status}`,
      duration: 4000,
    });
  });

  socket.on("task:completed", (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: "success",
      title: "Task Completed",
      message: `Task "${data.task.title}" has been completed!`,
      duration: 5000,
    });
  });

  socket.on("task:deadline", (data) => {
    const { addNotification } = useNotificationStore.getState();
    const isOverdue = new Date(data.task.deadline) < new Date();
    addNotification({
      type: isOverdue ? "error" : "warning",
      title: isOverdue ? "Task Overdue" : "Deadline Approaching",
      message: `Task "${data.task.title}" ${
        isOverdue ? "is overdue" : "deadline is approaching"
      }`,
      duration: 8000,
    });
  });

  socket.on("task:comment", (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: "info",
      title: "New Comment",
      message: `New comment on task "${data.task.title}"`,
      duration: 4000,
    });
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
