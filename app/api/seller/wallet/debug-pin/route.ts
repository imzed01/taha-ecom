import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(
      (session as { user: { id: string } }).user.id
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user._id,
      email: user.email,
      hasTransactionPin: !!user.transactionPin,
      transactionPin: user.transactionPin,
      pinType: typeof user.transactionPin,
      pinLength: user.transactionPin?.length,
    });
  } catch (error) {
    console.error("Error fetching user PIN:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
