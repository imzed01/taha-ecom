import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

// POST: Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId, title, message, type = "info" } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { message: "userId, title, and message are required" },
        { status: 400 }
      );
    }

    if (!["info", "warning", "success", "error"].includes(type)) {
      return NextResponse.json(
        { message: "Invalid notification type" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify that the user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isRead: false,
    });

    await notification.save();

    return NextResponse.json(
      {
        message: "Notification sent successfully",
        notification: {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get all notifications (for admin to view)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const query: { userId?: string } = {};
    if (userId) {
      query.userId = userId;
    }

    const notifications = await Notification.find(query)
      .populate("userId", "email username storeName role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
