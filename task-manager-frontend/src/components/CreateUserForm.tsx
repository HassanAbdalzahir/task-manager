"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { User, Mail, Lock, Crown, Users, UserCheck } from "lucide-react";
import { CreateUserRequest } from "@/types/user";
import { useAuthStore } from "@/store/authStore";
import axios from "@/lib/axios";

interface CreateUserFormProps {
  onUserCreated: () => void;
}

interface Manager {
  _id: string;
  name: string;
  role: string;
}

export default function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [availableManagers, setAvailableManagers] = useState<Manager[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserRequest>();

  const watchedRole = watch("role");

  useEffect(() => {
    setSelectedRole(watchedRole);
  }, [watchedRole]);

  const fetchAvailableManagers = useCallback(async () => {
    try {
      const response = await axios.get("/users/available-managers");
      const managersData =
        response.data.data?.managers || response.data.managers || [];
      let managers = Array.isArray(managersData) ? managersData : [];
      // Ensure current user is included if not already present
      if (
        user &&
        user.role !== "Employee" &&
        !managers.some((m) => m._id === user._id)
      ) {
        managers = [
          { _id: user._id, name: user.name, role: user.role },
          ...managers,
        ];
      }
      setAvailableManagers(managers);
    } catch (err) {
      console.error("Failed to fetch managers:", err);
      setAvailableManagers([]);
    }
  }, [user]);

  useEffect(() => {
    // Fetch available managers when role changes
    if (selectedRole && selectedRole !== "CEO") {
      fetchAvailableManagers();
    } else {
      setAvailableManagers([]);
    }
  }, [selectedRole, fetchAvailableManagers]);

  const onSubmit = async (data: CreateUserRequest) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Add managerId for non-CEO roles
      const userData = {
        ...data,
        ...(data.role !== "CEO" && { managerId: data.managerId }),
      };

      await axios.post("/users", userData);
      reset();
      setSelectedRole("");
      setSuccess("User created successfully!");
      onUserCreated();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String(err.response.data.message)
          : err instanceof Error
          ? err.message
          : "Failed to create user";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Create New User
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              {...register("name", { required: "Name is required" })}
              type="text"
              id="name"
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              type="email"
              id="email"
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              type="password"
              id="password"
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter password"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Role
          </label>
          <div className="relative">
            <Crown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              {...register("role", { required: "Role is required" })}
              id="role"
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Select a role</option>
              {user?.role === "CEO" && (
                <>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </>
              )}
              {user?.role === "Manager" && (
                <option value="Employee">Employee</option>
              )}
            </select>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.role.message}
            </p>
          )}
        </div>

        {selectedRole && selectedRole !== "CEO" && (
          <div>
            <label
              htmlFor="managerId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Manager
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <select
                {...register("managerId", {
                  required: "Manager is required for non-CEO roles",
                })}
                id="managerId"
                className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select a manager</option>
                {availableManagers.map((manager) => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} ({manager.role})
                  </option>
                ))}
              </select>
            </div>
            {errors.managerId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.managerId.message}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
            <p className="text-sm text-green-600 dark:text-green-400">
              {success}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              reset();
              setSelectedRole("");
              setError("");
              setSuccess("");
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Create User
          </button>
        </div>
      </form>
    </div>
  );
}
