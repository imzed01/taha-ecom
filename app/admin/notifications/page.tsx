"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Send,
  Search,
  Mail,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface User {
  _id: string;
  email: string;
  username?: string;
  storeName?: string;
  role: "admin" | "seller";
}

interface Notification {
  _id: string;
  userId: {
    _id: string;
    email: string;
    username?: string;
    storeName?: string;
    role: string;
  };
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<
    "info" | "warning" | "success" | "error"
  >("info");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as { role?: string })?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    fetchUsers();
    fetchNotifications();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/sellers");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!selectedUser || !notificationTitle || !notificationMessage) {
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
        }),
      });

      if (response.ok) {
        // Reset form
        setSelectedUser("");
        setNotificationTitle("");
        setNotificationMessage("");
        setNotificationType("info");

        // Refresh notifications
        fetchNotifications();
      } else {
        console.error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.storeName &&
        user.storeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username &&
        user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout requiredRole="admin" title="Notification Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="admin" title="Notification Management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Notification Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Send className="w-5 h-5 mr-2" />
            Send Notification
          </h2>

          <div className="space-y-4">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select User
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a user...</option>
                {filteredUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.storeName || user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notification Type
              </label>
              <select
                value={notificationType}
                onChange={(e) =>
                  setNotificationType(
                    e.target.value as "info" | "warning" | "success" | "error"
                  )
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Enter notification title..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message
              </label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message..."
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendNotification}
              disabled={
                !selectedUser ||
                !notificationTitle ||
                !notificationMessage ||
                isSending
              }
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Notification History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Notifications
          </h2>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications sent yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg border ${getNotificationColor(
                    notification.type
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Mail className="w-3 h-3 mr-1" />
                        {notification.userId.email}
                        {notification.userId.storeName && (
                          <span className="ml-2">
                            ({notification.userId.storeName})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
