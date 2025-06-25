"use client";

import { useAuthStore } from "@/store/authStore";
import {
  LogOut,
  User,
  Bell,
  Building,
  Settings,
  ChevronDown,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { disconnectSocket } from "@/lib/socket";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useEffect, useState, useRef } from "react";
import axios from "@/lib/axios";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { useNotificationStore } from "@/store/notificationStore";

export default function Header() {
  const { user, workspace, logout, updateWorkspace } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { notifications, removeNotification, markAllAsRead, getUnreadCount } =
    useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = getUnreadCount();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push("/login");
  };

  const handlePasswordChange = () => {
    setShowPasswordForm(true);
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordForm(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch workspace data if not available
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (user && !workspace) {
        try {
          const response = await axios.get("/auth/workspace");
          const workspaceData =
            response.data.data?.workspace || response.data.workspace;
          if (workspaceData) {
            updateWorkspace(workspaceData);
          }
        } catch {
          // Failed to fetch workspace
        }
      }
    };

    fetchWorkspace();
  }, [user, workspace, updateWorkspace]);

  // Helper function to check if a link is active
  const isActiveLink = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/tasks") {
      return pathname === "/tasks" || pathname.startsWith("/tasks/");
    }
    if (href === "/users") {
      return pathname === "/users";
    }
    if (href === "/tasks/create") {
      return pathname === "/tasks/create";
    }
    return false;
  };

  // Helper function to get link styles
  const getLinkStyles = (href: string) => {
    const isActive = isActiveLink(href);
    const baseStyles =
      "px-3 py-2 rounded-md text-sm font-medium transition-colors";

    if (isActive) {
      return `${baseStyles} text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20`;
    }

    return `${baseStyles} text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white`;
  };

  // Helper function to get mobile link styles
  const getMobileLinkStyles = (href: string) => {
    const isActive = isActiveLink(href);
    const baseStyles = "block px-3 py-2 text-sm font-medium transition-colors";

    if (isActive) {
      return `${baseStyles} text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20`;
    }

    return `${baseStyles} text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white`;
  };

  if (!user) return null;

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                NanoTask
              </Link>
              {workspace && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Building className="h-4 w-4" />
                  <span>{workspace.name}</span>
                </div>
              )}
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className={getLinkStyles("/dashboard")}>
                Dashboard
              </Link>
              <Link href="/tasks" className={getLinkStyles("/tasks")}>
                Tasks
              </Link>
              {user.role !== "Employee" && (
                <Link
                  href="/tasks/create"
                  className={getLinkStyles("/tasks/create")}
                >
                  Create Task
                </Link>
              )}
              <Link href="/users" className={getLinkStyles("/users")}>
                Users
              </Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100 transition-colors relative"
                  onClick={() => {
                    setShowNotifications((prev) => !prev);
                    if (!showNotifications) {
                      markAllAsRead(); // Mark all as read when opened
                    }
                  }}
                  aria-label="Show notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 border-gray-100 dark:border-gray-700 ${
                            !notification.isRead
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <div className="mt-1 mr-2">
                            {notification.type === "success" && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {notification.type === "error" && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            {notification.type === "warning" && (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                            {notification.type === "info" && (
                              <Bell className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center">
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 break-words">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {new Date(
                                notification.timestamp
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                          <button
                            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            onClick={() => removeNotification(notification.id)}
                            aria-label="Dismiss notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <DarkModeToggle />

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>{user.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {user.role}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handlePasswordChange}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Change Password</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <DarkModeToggle />
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100 transition-colors"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="md:hidden" ref={mobileMenuRef}>
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                {/* Workspace Info */}
                {workspace && (
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    <Building className="h-4 w-4" />
                    <span>{workspace.name}</span>
                  </div>
                )}

                {/* Navigation Links */}
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className={getMobileLinkStyles("/dashboard")}
                >
                  Dashboard
                </Link>
                <Link
                  href="/tasks"
                  onClick={closeMobileMenu}
                  className={getMobileLinkStyles("/tasks")}
                >
                  Tasks
                </Link>
                {user.role !== "Employee" && (
                  <Link
                    href="/tasks/create"
                    onClick={closeMobileMenu}
                    className={getMobileLinkStyles("/tasks/create")}
                  >
                    Create Task
                  </Link>
                )}
                <Link
                  href="/users"
                  onClick={closeMobileMenu}
                  className={getMobileLinkStyles("/users")}
                >
                  Users
                </Link>

                {/* User Info */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{user.name}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Mobile User Actions */}
                  <button
                    onClick={handlePasswordChange}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <ChangePasswordForm
                onSuccess={handlePasswordChangeSuccess}
                onCancel={() => setShowPasswordForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
