import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Wallet from "@/models/Wallet";

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
    const requestBody = await request.json();

    // Handle both 'action' and 'status' fields for backward compatibility
    const action =
      requestBody.action ||
      (requestBody.status === "verified"
        ? "approve"
        : requestBody.status === "rejected"
        ? "reject"
        : null);
    const rejectionReason = requestBody.rejectionReason;

    if (!["approve", "reject"].includes(action)) {
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

    if (action === "approve") {
      seller.verificationStatus = "verified";
      seller.rejectionReason = undefined;
    } else {
      seller.verificationStatus = "rejected";
      seller.rejectionReason = rejectionReason || "No reason provided";
    }

    await seller.save();

    // Create wallet for verified sellers
    if (seller.verificationStatus === "verified") {
      await Wallet.findOneAndUpdate(
        { sellerId: seller._id },
        { sellerId: seller._id, balance: 0, pendingBalance: 0, totalEarned: 0 },
        { upsert: true }
      );
    }

    return NextResponse.json(
      { message: `Seller ${action}d successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing seller verification:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
