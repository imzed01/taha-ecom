import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SupportMessage from "@/models/SupportMessage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  if (!sellerId) {
    return NextResponse.json({ error: "Missing sellerId" }, { status: 400 });
  }
  try {
    await dbConnect();

    // Find all messages for this seller (both sent and received)
    const messages = await SupportMessage.find({
      $or: [
        // Seller's messages to admin
        { senderId: sellerId, senderRole: "seller", receiverId: "admin" },
        // Admin's messages to this seller
        { senderRole: "admin", receiverId: sellerId },
      ],
    }).sort({ createdAt: 1 });

    console.log(`Found ${messages.length} messages for seller ${sellerId}`);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
