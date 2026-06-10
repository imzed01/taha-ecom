import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Wallet from "@/models/Wallet";
import WalletTransaction from "@/models/WalletTransaction";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sellerId, amount, action, reason } = await request.json();

    if (!sellerId || !amount || !action || !reason) {
      return NextResponse.json(
        { error: "Seller ID, amount, action, and reason are required" },
        { status: 400 }
      );
    }

    if (!["add", "deduct"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be either 'add' or 'deduct'" },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify seller exists
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== "seller") {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get or create seller wallet
    let wallet = await Wallet.findOne({ sellerId });
    if (!wallet) {
      wallet = new Wallet({
        sellerId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
      });
    }

    // Perform the adjustment
    if (action === "add") {
      wallet.balance += numAmount;
      wallet.totalEarned += numAmount;
    } else {
      // For deduction, check if seller has sufficient balance
      if (wallet.balance < numAmount) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            currentBalance: wallet.balance,
            requestedDeduction: numAmount,
          },
          { status: 400 }
        );
      }
      wallet.balance -= numAmount;
    }

    await wallet.save();

    // Create transaction record
    const transaction = new WalletTransaction({
      sellerId,
      type:
        action === "add" ? "admin_adjustment_add" : "admin_adjustment_deduct",
      amount: numAmount,
      status: "completed",
      description: `Admin ${
        action === "add" ? "added" : "deducted"
      } $${numAmount.toFixed(2)} - ${reason}`,
      adminNotes: reason,
    });
    await transaction.save();

    return NextResponse.json({
      message: `Successfully ${
        action === "add" ? "added" : "deducted"
      } $${numAmount.toFixed(2)} from seller wallet`,
      wallet: {
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        totalEarned: wallet.totalEarned,
      },
      transaction,
    });
  } catch (error) {
    console.error("Error adjusting seller wallet balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Get all sellers with their wallet information
export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all verified sellers with their wallet information
    const sellers = await User.find({
      role: "seller",
      verificationStatus: "verified",
    }).select("_id email storeName name");

    const sellersWithWallets = await Promise.all(
      sellers.map(async (seller) => {
        const wallet = await Wallet.findOne({ sellerId: seller._id });
        return {
          _id: seller._id,
          email: seller.email,
          storeName: seller.storeName,
          name: seller.name,
          wallet: wallet
            ? {
                balance: wallet.balance,
                pendingBalance: wallet.pendingBalance,
                totalEarned: wallet.totalEarned,
              }
            : {
                balance: 0,
                pendingBalance: 0,
                totalEarned: 0,
              },
        };
      })
    );

    return NextResponse.json(sellersWithWallets);
  } catch (error) {
    console.error("Error fetching sellers with wallets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
