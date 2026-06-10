import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const allRequests = await WalletTransaction.find({
      type: {
        $in: [
          "topup",
          "withdrawal",
          "funding_request",
          "admin_adjustment_add",
          "admin_adjustment_deduct",
        ],
      },
    })
      .populate("sellerId", "email storeName")
      .sort({ createdAt: -1 });

    return NextResponse.json(allRequests);
  } catch (error) {
    console.error("Error fetching wallet requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
