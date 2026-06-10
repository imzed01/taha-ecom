import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import SupportMessage from "@/models/SupportMessage";

// POST: Mark admin messages as seen by seller
export async function POST() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    // Mark all messages from admin to this seller as seen by seller
    const result = await SupportMessage.updateMany(
      {
        senderRole: "admin",
        receiverId: sellerId,
        seenBySeller: { $ne: true },
      },
      {
        $set: { seenBySeller: true },
      }
    );

    console.log(
      `Marked ${result.modifiedCount} admin messages as seen by seller ${sellerId}`
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as seen by seller:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as seen" },
      { status: 500 }
    );
  }
}
