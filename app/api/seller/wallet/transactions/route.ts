import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    const transactions = await WalletTransaction.find({ sellerId })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching seller transactions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
