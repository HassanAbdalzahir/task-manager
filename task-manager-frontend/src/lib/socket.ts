import { io, Socket } from "socket.io-client";
import { useNotificationStore } from "@/store/notificationStore";

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  const socketServer =
    process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:3100";
  const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io";

  socket = io(socketServer, {
    path: socketPath,
    auth: {
      token: `Bearer ${token}`,
    },
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {});

  socket.on("disconnect", () => {});

  socket.on("connect_error", () => {});

  // Task-related events
  socket.on("task:assigned", (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: "info",
      title: "New Task Assigned",
      message: `You have been assigned: "${data.data.title}"`,
      duration: 6000,
    });
  });

  socket.on("task:updated", (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: "success",
      title: "Task Updated",
      message: `Task "${data.data.title}" status changed to ${data.data.status}`,
      duration: 4000,
    });
  });

  socket.on("task:completed", (data) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: "success",
      title: "Task Completed",
      message: `Task "${data.data.title}" has been completed!`,
      duration: 5000,
    });
  });

  socket.on("task:deadline", (data) => {
    const { addNotification } = useNotificationStore.getState();
    const isOverdue = new Date(data.data.deadline) < new Date();
    addNotification({
      type: isOverdue ? "error" : "warning",
      title: isOverdue ? "Task Overdue" : "Deadline Approaching",
      message: `Task "${data.data.title}" ${
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
      message: `New comment on task "${data.data.title}"`,
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
