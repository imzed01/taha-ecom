import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import Wallet from "@/models/Wallet";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action } = await params;
    const { adminNotes } = await request.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await dbConnect();

    // Find the request (can be topup or funding_request)
    const walletRequest = await WalletTransaction.findById(id);
    if (
      !walletRequest ||
      (walletRequest.type !== "funding_request" &&
        walletRequest.type !== "topup")
    ) {
      return NextResponse.json(
        { error: "Wallet request not found" },
        { status: 404 }
      );
    }

    if (walletRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      );
    }

    // Update the request status
    walletRequest.status = action === "approve" ? "approved" : "rejected";
    if (adminNotes) {
      walletRequest.adminNotes = adminNotes;
    }

    await walletRequest.save();

    // If approved, add funds to seller's wallet
    if (action === "approve") {
      let sellerWallet = await Wallet.findOne({
        sellerId: walletRequest.sellerId,
      });

      if (!sellerWallet) {
        // Create wallet if it doesn't exist
        sellerWallet = new Wallet({
          sellerId: walletRequest.sellerId,
          balance: walletRequest.amount,
          pendingBalance: 0,
          totalEarned: 0,
        });
      } else {
        // Add to existing balance
        sellerWallet.balance += walletRequest.amount;
      }

      await sellerWallet.save();
    }

    return NextResponse.json({
      message: `Wallet request ${action}d successfully`,
      request: walletRequest,
    });
  } catch (error) {
    console.error("Error processing wallet request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
