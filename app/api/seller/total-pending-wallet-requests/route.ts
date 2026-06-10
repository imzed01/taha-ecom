import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function GET() {
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

    // Count pending funding requests for this seller that haven't been seen
    const pendingFundingRequests = await WalletTransaction.countDocuments({
      sellerId,
      type: { $in: ["topup", "funding_request"] },
      status: "pending",
      seenBySeller: { $ne: true },
    });

    // Count pending withdrawal requests for this seller that haven't been seen
    const pendingWithdrawalRequests = await WithdrawalRequest.countDocuments({
      sellerId,
      status: "pending",
      seenBySeller: { $ne: true },
    });

    const totalPendingRequests =
      pendingFundingRequests + pendingWithdrawalRequests;

    return NextResponse.json({
      totalPendingRequests,
      pendingFundingRequests,
      pendingWithdrawalRequests,
    });
  } catch (error) {
    console.error("Error fetching pending wallet requests:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
