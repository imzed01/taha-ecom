import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSessionWithAuth()) as {
      user: { id: string };
    };

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, transactionPin } = await request.json();

    if (!amount || amount <= 0 || !transactionPin) {
      return NextResponse.json(
        { error: "Amount and transaction PIN are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get seller details
    const seller = await User.findById(
      (session as { user: { id: string } }).user.id
    );
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }
    if (!seller.transactionPin) {
      return NextResponse.json(
        { error: "No transaction PIN set for this seller" },
        { status: 400 }
      );
    }
    // Normalize and compare pins
    const storedPin = String(seller.transactionPin).trim();
    const submittedPin = String(transactionPin).trim();

    console.log("Debug PIN verification (funding):", {
      userId: (session as { user: { id: string } }).user.id,
      userFound: !!seller,
      storedPin: seller?.transactionPin,
      submittedPin: transactionPin,
      pinType: typeof seller?.transactionPin,
      submittedPinType: typeof transactionPin,
      pinsMatch: seller?.transactionPin === transactionPin,
      userEmail: seller?.email,
      userRole: seller?.role,
      storedPinNormalized: storedPin,
      submittedPinNormalized: submittedPin,
      normalizedPinsMatch: storedPin === submittedPin,
    });

    if (storedPin !== submittedPin) {
      return NextResponse.json(
        { error: "Invalid transaction PIN" },
        { status: 400 }
      );
    }

    // Create funding request transaction
    const fundingRequest = new WalletTransaction({
      sellerId: (session as { user: { id: string } }).user.id,
      type: "topup", // Temporarily use topup type
      amount: amount,
      status: "pending",
      description: `Funding request for $${amount}`,
    });

    try {
      await fundingRequest.save();
    } catch (saveError) {
      console.error("Save error details:", saveError);
      throw saveError;
    }

    return NextResponse.json({
      message: "Funding request submitted successfully",
      request: fundingRequest,
    });
  } catch (error) {
    console.error("Error creating funding request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = (await getServerSessionWithAuth()) as {
      user: { id: string };
    };

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const fundingRequests = await WalletTransaction.find({
      sellerId: (session as { user: { id: string } }).user.id,
      type: "funding_request",
    }).sort({ createdAt: -1 });

    return NextResponse.json(fundingRequests);
  } catch (error) {
    console.error("Error fetching funding requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
