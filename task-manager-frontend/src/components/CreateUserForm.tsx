"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { User, Mail, Lock, Crown, Users, UserCheck } from "lucide-react";
import { RegisterRequest } from "@/types/user";
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
  } = useForm<RegisterRequest>();

  const watchedRole = watch("role");

  useEffect(() => {
    setSelectedRole(watchedRole);
  }, [watchedRole]);

  const fetchAvailableManagers = useCallback(async () => {
    try {
      let managers: Manager[] = [];

      if (user?.role === "CEO") {
        // CEO can assign managers to anyone including themselves
        const response = await axios.get("/users");
        const usersData =
          response.data.users ||
          response.data.data?.users ||
          response.data ||
          [];
        const users = Array.isArray(usersData) ? usersData : [];
        managers = users; // Include all users including the CEO themselves
      } else {
        // For non-CEO users, get their subordinates and add the CEO
        const response = await axios.get("/users/subordinates");
        const usersData =
          response.data.users ||
          response.data.data?.users ||
          response.data ||
          [];
        const users = Array.isArray(usersData) ? usersData : [];

        if (user?.role === "Manager") {
          // Manager can only assign employees
          managers = users.filter((u: Manager) => u.role === "Employee");
        } else {
          // Employee can't assign anyone, but we still need to show available managers
          managers = users;
        }

        // Add the CEO to the managers list
        try {
          // Get the CEO by finding the user without a manager (top of hierarchy)
          const allUsersResponse = await axios.get("/users/subordinates");
          const allUsersData =
            allUsersResponse.data.users ||
            allUsersResponse.data.data?.users ||
            allUsersResponse.data ||
            [];
          const allUsers = Array.isArray(allUsersData) ? allUsersData : [];
          const ceo = allUsers.find((u: Manager) => u.role === "CEO");

          if (ceo && !managers.some((m) => m._id === ceo._id)) {
            managers.unshift(ceo); // Add CEO at the beginning of the list
          }
        } catch (ceoErr) {
          console.error("Failed to fetch CEO:", ceoErr);
        }
      }

      setAvailableManagers(managers);
    } catch (err) {
      console.error("Failed to fetch managers:", err);
      setAvailableManagers([]);
    }
  }, [user?.role]);

  useEffect(() => {
    // Fetch available managers when role changes
    if (selectedRole && selectedRole !== "CEO") {
      fetchAvailableManagers();
    } else {
      setAvailableManagers([]);
    }
  }, [selectedRole, fetchAvailableManagers]);

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Add managerId for non-CEO roles
      const registrationData = {
        ...data,
        ...(data.role !== "CEO" && { managerId: data.managerId }),
      };

      await axios.post("/auth/register", registrationData);
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Create New User
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...register("name", { required: "Name is required" })}
              type="text"
              id="name"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Role
          </label>
          <div className="relative">
            <Crown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              {...register("role", { required: "Role is required" })}
              id="role"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a role</option>
              {user?.role === "CEO" && <option value="Manager">Manager</option>}
              <option value="Employee">Employee</option>
            </select>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        {/* Manager Selection - only show for non-CEO roles */}
        {selectedRole && selectedRole !== "CEO" && (
          <div>
            <label
              htmlFor="managerId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Manager
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register("managerId", {
                  required:
                    selectedRole !== "CEO" ? "Manager is required" : false,
                })}
                id="managerId"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <p className="mt-1 text-sm text-red-600">
                {errors.managerId.message}
              </p>
            )}
            {availableManagers.length === 0 && selectedRole !== "CEO" && (
              <p className="mt-1 text-sm text-yellow-600">
                No available managers found. Please create a manager first.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            isLoading ||
            (selectedRole !== "CEO" && availableManagers.length === 0)
          }
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Create User
            </>
          )}
        </button>
      </form>
    </div>
  );
}
