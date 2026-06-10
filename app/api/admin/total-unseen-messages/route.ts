import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SupportMessage from "@/models/SupportMessage";

// GET: Get total count of unseen messages for admin sidebar badge
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Count all messages from sellers that haven't been seen by admin
    const totalUnseenCount = await SupportMessage.countDocuments({
      senderRole: "seller",
      seenByAdmin: { $ne: true },
    });

    console.log(
      `Total unseen messages for admin ${adminId}: ${totalUnseenCount}`
    );

    return NextResponse.json({
      totalUnseenCount,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching total unseen messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch total unseen messages" },
      { status: 500 }
    );
  }
}
