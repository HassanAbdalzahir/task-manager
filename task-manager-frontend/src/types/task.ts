export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  deadline?: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  message: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
  };
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedTo: string;
  deadline?: string;
}

export interface UpdateTaskStatusRequest {
  status: "pending" | "in_progress" | "completed";
}

export interface AddCommentRequest {
  message: string;
}

export interface TaskStats {
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
}
