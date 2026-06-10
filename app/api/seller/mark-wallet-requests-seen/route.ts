import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function POST() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    if (!sellerId) {
      return NextResponse.json(
        { message: "Seller ID not found" },
        { status: 400 }
      );
    }

    // Mark seller's pending funding requests as seen
    await WalletTransaction.updateMany(
      {
        sellerId,
        type: { $in: ["topup", "funding_request"] },
        status: "pending",
        seenBySeller: { $ne: true },
      },
      {
        $set: { seenBySeller: true },
      }
    );

    // Mark seller's pending withdrawal requests as seen
    await WithdrawalRequest.updateMany(
      {
        sellerId,
        status: "pending",
        seenBySeller: { $ne: true },
      },
      {
        $set: { seenBySeller: true },
      }
    );

    return NextResponse.json({
      message: "Wallet requests marked as seen",
      success: true,
    });
  } catch (error) {
    console.error("Error marking wallet requests as seen:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
