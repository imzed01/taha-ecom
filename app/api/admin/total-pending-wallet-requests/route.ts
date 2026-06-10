import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Count pending funding requests (topup/funding_request) that haven't been seen by admin
    const pendingFundingRequests = await WalletTransaction.countDocuments({
      type: { $in: ["topup", "funding_request"] },
      status: "pending",
      seenByAdmin: { $ne: true },
    });

    // Count pending withdrawal requests that haven't been seen by admin
    const pendingWithdrawalRequests = await WithdrawalRequest.countDocuments({
      status: "pending",
      seenByAdmin: { $ne: true },
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
