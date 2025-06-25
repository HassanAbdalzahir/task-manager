"use client";

import { useState } from "react";
import { changePassword } from "../lib/axios";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isRequired?: boolean;
}

export default function ChangePasswordForm({
  onSuccess,
  onCancel,
  isRequired = false,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotificationStore();
  const { user, updateUser } = useAuthStore();

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    addNotification({
      title:
        type === "error" ? "Error" : type === "success" ? "Success" : "Info",
      message,
      type,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showNotification("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showNotification(
        "New password must be at least 6 characters long",
        "error"
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        showNotification("Password changed successfully", "success");

        // Update user in store to reflect requiresPasswordChange = false
        if (user && response.data?.user) {
          updateUser(response.data.user);
        }

        onSuccess?.();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change password";
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const message = axiosError?.response?.data?.message || errorMessage;
      showNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isRequired ? "Change Your Password" : "Change Password"}
        </h2>
        {isRequired && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            For security reasons, you must change your password before
            continuing.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            placeholder="Enter your current password"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            placeholder="Enter your new password"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
            placeholder="Confirm your new password"
            required
            minLength={6}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            {isLoading ? "Changing..." : "Change Password"}
          </button>

          {!isRequired && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
