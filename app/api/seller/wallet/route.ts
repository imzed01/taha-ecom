import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Wallet from "@/models/Wallet";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    let wallet = await Wallet.findOne({ sellerId });

    if (!wallet) {
      // Create a new wallet if it doesn't exist
      wallet = new Wallet({
        sellerId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
      });
      await wallet.save();
    }

    return NextResponse.json({
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
    });
  } catch (error) {
    console.error("Error fetching seller wallet:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
