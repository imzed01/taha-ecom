import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function GET() {
  try {
    console.log("API: total-wallet-request-updates called");
    const session = await getServerSessionWithAuth();
    console.log("API: Session:", session ? "exists" : "null");

    if (!checkSellerAuth(session)) {
      console.log("API: Unauthorized - not a seller");
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

    // Count funding requests that have been approved/rejected but not seen by seller
    const fundingUpdates = await WalletTransaction.countDocuments({
      sellerId,
      type: { $in: ["topup", "funding_request"] },
      status: { $in: ["approved", "rejected"] },
      seenBySeller: { $ne: true },
    });

    // Count withdrawal requests that have been approved/rejected but not seen by seller
    const withdrawalUpdates = await WithdrawalRequest.countDocuments({
      sellerId,
      status: { $in: ["approved", "rejected"] },
      seenBySeller: { $ne: true },
    });

    const totalUpdates = fundingUpdates + withdrawalUpdates;

    console.log("API: Returning data:", {
      totalUpdates,
      fundingUpdates,
      withdrawalUpdates,
    });

    return NextResponse.json({
      totalUpdates,
      fundingUpdates,
      withdrawalUpdates,
    });
  } catch (error) {
    console.error("Error fetching wallet request updates:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
