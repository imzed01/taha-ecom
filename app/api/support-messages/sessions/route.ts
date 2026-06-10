import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SupportMessage from "@/models/SupportMessage";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    // Find all unique sellerIds who have chatted (as sender or receiver)
    const sellerIds = await SupportMessage.aggregate([
      {
        $match: {
          $or: [{ senderRole: "seller" }, { receiverId: "admin" }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderRole", "seller"] },
              "$senderId",
              "$receiverId",
            ],
          },
        },
      },
      {
        $match: { _id: { $ne: "admin" } },
      },
    ]);
    const ids = sellerIds.map((s) => s._id);
    // Fetch seller info - only verified sellers
    const sellers = await User.find(
      {
        _id: { $in: ids },
        role: "seller",
        verificationStatus: "verified",
      },
      "_id email storeName name verificationStatus createdAt"
    );
    return NextResponse.json(sellers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
