export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "CEO" | "Manager" | "Employee";
  managerId?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
  workspaceId: string;
  requiresPasswordChange: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  workspace?: Workspace;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "CEO" | "Manager" | "Employee";
  managerId?: string;
  workspaceName?: string;
  workspaceDescription?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: "CEO" | "Manager" | "Employee";
  managerId?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
