import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WithdrawalRequest from "@/models/WithdrawalRequest";
import User from "@/models/User";
import Wallet from "@/models/Wallet";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const withdrawalRequests = await WithdrawalRequest.find({
      sellerId: (session as { user: { id: string } }).user.id,
    })
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, transactionPin, paymentMethod, paymentDetails } =
      await request.json();

    if (!amount || !transactionPin || !paymentMethod || !paymentDetails) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify transaction PIN
    const user = await User.findById(
      (session as { user: { id: string } }).user.id
    );

    console.log("Debug PIN verification:", {
      userId: (session as { user: { id: string } }).user.id,
      userFound: !!user,
      storedPin: user?.transactionPin,
      submittedPin: transactionPin,
      pinType: typeof user?.transactionPin,
      submittedPinType: typeof transactionPin,
      pinsMatch: user?.transactionPin === transactionPin,
      userEmail: user?.email,
      userRole: user?.role,
      storedPinNormalized: user?.transactionPin
        ? String(user.transactionPin).trim()
        : null,
      submittedPinNormalized: String(transactionPin).trim(),
      normalizedPinsMatch: user?.transactionPin
        ? String(user.transactionPin).trim() === String(transactionPin).trim()
        : false,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    if (!user.transactionPin) {
      return NextResponse.json(
        { error: "No transaction PIN found for this user" },
        { status: 400 }
      );
    }

    // Normalize PINs for comparison (trim whitespace and ensure string type)
    const storedPin = String(user.transactionPin).trim();
    const submittedPin = String(transactionPin).trim();

    if (storedPin !== submittedPin) {
      return NextResponse.json(
        { error: "Invalid transaction PIN" },
        { status: 400 }
      );
    }

    // Check if amount is valid
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Check if seller has sufficient available balance (not pending balance)
    const wallet = await Wallet.findOne({
      sellerId: (session as { user: { id: string } }).user.id,
    });
    if (!wallet || wallet.balance < numAmount) {
      return NextResponse.json(
        {
          error:
            "Insufficient available balance. You can only withdraw from your available balance, not pending balance.",
        },
        { status: 400 }
      );
    }

    // Validate payment details based on method
    if (paymentMethod === "crypto") {
      if (!paymentDetails.walletAddress || !paymentDetails.cryptoType) {
        return NextResponse.json(
          { error: "Crypto wallet address and type are required" },
          { status: 400 }
        );
      }
    } else if (paymentMethod === "bank_account") {
      if (
        !paymentDetails.bankName ||
        !paymentDetails.accountNumber ||
        !paymentDetails.accountHolderName
      ) {
        return NextResponse.json(
          {
            error:
              "Bank name, account number, and account holder name are required",
          },
          { status: 400 }
        );
      }
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      sellerId: (session as { user: { id: string } }).user.id,
      amount: numAmount,
      transactionPin,
      paymentMethod,
      paymentDetails,
      status: "pending",
    });

    await withdrawalRequest.save();

    return NextResponse.json(withdrawalRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
