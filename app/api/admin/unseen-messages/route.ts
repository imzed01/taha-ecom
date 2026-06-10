import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SupportMessage from "@/models/SupportMessage";

// GET: Get unseen message counts for all sellers
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

    // Get all unique sellers who have sent messages
    const sellers = await SupportMessage.distinct("senderId", {
      senderRole: "seller",
    });

    const unseenCounts = [];

    for (const sellerId of sellers) {
      // Count messages from this seller that haven't been seen by admin
      const count = await SupportMessage.countDocuments({
        senderId: sellerId,
        senderRole: "seller",
        seenByAdmin: { $ne: true },
      });

      if (count > 0) {
        unseenCounts.push({
          sellerId,
          count,
        });
      }
    }

    console.log(`Found ${unseenCounts.length} sellers with unseen messages`);
    return NextResponse.json(unseenCounts);
  } catch (error) {
    console.error("Error fetching unseen messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch unseen messages" },
      { status: 500 }
    );
  }
}

// POST: Mark messages as seen for a specific seller
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { sellerId, adminId } = await request.json();

    if (!sellerId || !adminId) {
      return NextResponse.json(
        { error: "Seller ID and Admin ID are required" },
        { status: 400 }
      );
    }

    // Mark all messages from this seller as seen by admin
    const result = await SupportMessage.updateMany(
      {
        senderId: sellerId,
        senderRole: "seller",
        seenByAdmin: { $ne: true },
      },
      {
        $set: { seenByAdmin: true },
      }
    );

    console.log(
      `Marked ${result.modifiedCount} messages as seen for seller ${sellerId}`
    );
    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as seen" },
      { status: 500 }
    );
  }
}
