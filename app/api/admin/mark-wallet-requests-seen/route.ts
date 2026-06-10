import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function POST() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Mark all pending funding requests as seen by admin
    await WalletTransaction.updateMany(
      {
        type: { $in: ["topup", "funding_request"] },
        status: "pending",
        seenByAdmin: { $ne: true },
      },
      {
        $set: { seenByAdmin: true },
      }
    );

    // Mark all pending withdrawal requests as seen by admin
    await WithdrawalRequest.updateMany(
      {
        status: "pending",
        seenByAdmin: { $ne: true },
      },
      {
        $set: { seenByAdmin: true },
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
