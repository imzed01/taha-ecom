import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import Wallet from "@/models/Wallet";
import WalletTransaction from "@/models/WalletTransaction";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();
    const { id, action } = await params;

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { adminNotes } = await request.json();

    await dbConnect();

    const withdrawalRequest = await WithdrawalRequest.findById(id);
    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    if (withdrawalRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Withdrawal request has already been processed" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Check if seller still has sufficient available balance (not pending balance)
      const wallet = await Wallet.findOne({
        sellerId: withdrawalRequest.sellerId,
      });
      if (!wallet || wallet.balance < withdrawalRequest.amount) {
        return NextResponse.json(
          { error: "Seller has insufficient available balance" },
          { status: 400 }
        );
      }

      // Deduct amount from seller's available balance only (not pending balance)
      wallet.balance -= withdrawalRequest.amount;
      await wallet.save();

      // Create transaction record
      const transaction = new WalletTransaction({
        sellerId: withdrawalRequest.sellerId,
        type: "withdrawal",
        amount: withdrawalRequest.amount,
        description: `Withdrawal request approved - ${withdrawalRequest.paymentMethod}`,
        status: "completed",
        metadata: {
          withdrawalRequestId: withdrawalRequest._id,
          paymentMethod: withdrawalRequest.paymentMethod,
          paymentDetails: withdrawalRequest.paymentDetails,
        },
      });
      await transaction.save();

      // Update withdrawal request status
      withdrawalRequest.status = "approved";
      withdrawalRequest.processedAt = new Date();
      if (adminNotes) {
        withdrawalRequest.adminNotes = adminNotes;
      }
      await withdrawalRequest.save();

      return NextResponse.json({
        message: "Withdrawal request approved successfully",
        withdrawalRequest,
      });
    } else {
      // Reject the request
      withdrawalRequest.status = "rejected";
      withdrawalRequest.processedAt = new Date();
      if (adminNotes) {
        withdrawalRequest.adminNotes = adminNotes;
      }
      await withdrawalRequest.save();

      return NextResponse.json({
        message: "Withdrawal request rejected",
        withdrawalRequest,
      });
    }
  } catch (error) {
    console.error("Error processing withdrawal request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
