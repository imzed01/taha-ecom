import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET: Get notifications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session as any).user.id;

    const query: { userId: string; isRead?: boolean } = {
      userId,
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
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

// PATCH: Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { message: "notificationIds array is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session as any).user.id;

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId,
      },
      {
        $set: { isRead: true },
      }
    );

    return NextResponse.json({
      message: "Notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
