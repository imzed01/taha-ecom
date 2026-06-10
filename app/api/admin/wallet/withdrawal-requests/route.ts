import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const withdrawalRequests = await WithdrawalRequest.find()
      .populate("sellerId", "storeName email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(withdrawalRequests);
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
