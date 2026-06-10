import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import ReferralCode from "@/models/ReferralCode";

// Generate a random 6-digit code
function generateReferralCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if a code already exists
async function isCodeUnique(code: string): Promise<boolean> {
  const existingCode = await ReferralCode.findOne({ code });
  return !existingCode;
}

// Generate a unique referral code
async function generateUniqueCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateReferralCode();
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error("Failed to generate unique code after maximum attempts");
    }
  } while (!(await isCodeUnique(code)));

  return code;
}

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const referralCodes = await ReferralCode.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      referralCodes,
    });
  } catch (error) {
    console.error("Error fetching referral codes:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Generate a unique 6-digit code
    const code = await generateUniqueCode();

    // Create new referral code
    const referralCode = new ReferralCode({
      code,
      isUsed: false,
      generatedBy: (session as { user: { id: string } }).user.id,
    });

    await referralCode.save();

    return NextResponse.json({
      success: true,
      message: "Referral code generated successfully",
      code,
    });
  } catch (error) {
    console.error("Error generating referral code:", error);
    return NextResponse.json(
      { message: "Failed to generate referral code" },
      { status: 500 }
    );
  }
}
