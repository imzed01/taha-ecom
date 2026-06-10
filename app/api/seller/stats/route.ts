import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import SellerProduct from "@/models/SellerProduct";
import Order from "@/models/Order";
import Wallet from "@/models/Wallet";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    // Get counts
    const totalProducts = await SellerProduct.countDocuments({
      sellerId,
      isActive: true,
    });
    const totalOrders = await Order.countDocuments({ sellerId });
    const pendingOrders = await Order.countDocuments({
      sellerId,
      status: "pending",
    });

    // Get wallet info
    let wallet = await Wallet.findOne({ sellerId: sellerId });
    if (!wallet) {
      wallet = { balance: 0, pendingBalance: 0, totalEarned: 0 };
    }

    // Calculate total earnings from delivered orders
    const deliveredOrders = await Order.find({
      sellerId,
      status: "delivered",
    });
    const totalEarnings = deliveredOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Get seller rating
    const seller = await User.findById(sellerId).select("rating ratingCount");
    const rating = seller?.rating || 5;
    const ratingCount = seller?.ratingCount || 0;

    return NextResponse.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalEarnings,
      availableBalance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      rating,
      ratingCount,
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
