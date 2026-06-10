import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import WalletTransaction from "@/models/WalletTransaction";
import WithdrawalRequest from "@/models/WithdrawalRequest";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get counts
    const totalSellers = await User.countDocuments({ role: "seller" });
    const pendingVerifications = await User.countDocuments({
      role: "seller",
      verificationStatus: "pending",
    });
    const totalOrders = await Order.countDocuments();
    const withdrawalRequests = await WithdrawalRequest.countDocuments({
      status: "pending",
    });

    // Calculate total revenue
    const orders = await Order.find({ status: "delivered" });
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Get pending wallet requests
    const pendingWalletRequests = await WalletTransaction.countDocuments({
      type: { $in: ["topup", "withdrawal"] },
      status: "pending",
    });

    return NextResponse.json({
      totalSellers,
      pendingVerifications,
      totalOrders,
      totalRevenue,
      pendingWalletRequests,
      withdrawalRequests,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
