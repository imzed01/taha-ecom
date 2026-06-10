import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action, reason } = await request.json();

    console.log("Block/Unblock request:", { id, action, reason });

    if (!["block", "unblock"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    await dbConnect();

    const seller = await User.findById(id);
    if (!seller || seller.role !== "seller") {
      return NextResponse.json(
        { message: "Seller not found" },
        { status: 404 }
      );
    }

    console.log("Found seller:", {
      id: seller._id,
      email: seller.email,
      currentIsBlocked: seller.isBlocked,
    });

    if (action === "block") {
      seller.isBlocked = true;
      seller.blockedReason = reason || "No reason provided";
    } else {
      seller.isBlocked = false;
      seller.blockedReason = undefined;
    }

    await seller.save();

    console.log("Updated seller:", {
      isBlocked: seller.isBlocked,
      blockedReason: seller.blockedReason,
    });

    return NextResponse.json(
      {
        message: `Seller ${action}ed successfully`,
        isBlocked: seller.isBlocked,
        blockedReason: seller.blockedReason,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing seller block/unblock:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
