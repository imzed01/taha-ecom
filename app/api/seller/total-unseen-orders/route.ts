import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

// GET: Get total count of unseen orders for seller sidebar badge
export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    // Count all orders for this seller that haven't been seen by the seller
    const totalUnseenCount = await Order.countDocuments({
      sellerId,
      seenBySeller: { $ne: true },
    });

    console.log(
      `Total unseen orders for seller ${sellerId}: ${totalUnseenCount}`
    );

    return NextResponse.json({
      totalUnseenCount,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching total unseen orders for seller:", error);
    return NextResponse.json(
      { error: "Failed to fetch total unseen orders" },
      { status: 500 }
    );
  }
}
