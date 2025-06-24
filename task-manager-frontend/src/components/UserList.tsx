"use client";

import { User as UserType } from "@/types/user";
import { User, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

interface UserListProps {
  users: UserType[];
  title: string;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "CEO":
      return "bg-purple-100 text-purple-800";
    case "Manager":
      return "bg-blue-100 text-blue-800";
    case "Employee":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function UserList({ users, title }: UserListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {users.length === 0 ? (
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No users found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no users under your management.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>{user.email}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        Joined{" "}
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
