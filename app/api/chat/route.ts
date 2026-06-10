import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SupportMessage from "@/models/SupportMessage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, senderRole, receiverId, message, image } = body;

    console.log("Chat API POST request:", {
      senderId,
      senderRole,
      receiverId,
      messageLength: message?.length || 0,
      hasImage: !!image,
    });

    if (!senderId || !senderRole || !receiverId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate senderRole
    if (!["seller", "admin"].includes(senderRole)) {
      return NextResponse.json(
        { error: "Invalid senderRole. Must be 'seller' or 'admin'" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Ensure message field is never empty - use a placeholder for image-only messages
    const messageText = message?.trim() || (image ? "[Image]" : "");

    // Additional validation: ensure we have either a message or an image
    if (!messageText && !image) {
      return NextResponse.json(
        { error: "Message or image is required" },
        { status: 400 }
      );
    }

    const savedMessage = await SupportMessage.create({
      senderId,
      senderRole,
      receiverId,
      message: messageText,
      image: image || null,
      createdAt: new Date(),
      seenByAdmin: senderRole === "admin" ? true : false,
      seenBySeller: senderRole === "seller" ? true : false,
    });

    console.log("Message saved:", savedMessage._id, "Image present:", !!image);

    return NextResponse.json({
      success: true,
      messageId: savedMessage._id,
      message: savedMessage,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json({ error: "Missing sellerId" }, { status: 400 });
    }

    await dbConnect();

    const messages = await SupportMessage.find({
      $or: [
        { senderId: sellerId, senderRole: "seller", receiverId: "admin" },
        { senderRole: "admin", receiverId: sellerId },
      ],
    }).sort({ createdAt: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
