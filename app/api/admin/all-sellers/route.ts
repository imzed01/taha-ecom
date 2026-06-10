import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    await dbConnect();

    // Build search query - only show verified sellers
    const query: {
      role: string;
      verificationStatus: string;
      $or?: Array<Record<string, unknown>>;
    } = {
      role: "seller",
      verificationStatus: "verified",
    };

    if (searchTerm.trim()) {
      query.$or = [
        { email: { $regex: searchTerm, $options: "i" } },
        { storeName: { $regex: searchTerm, $options: "i" } },
        { name: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const sellers = await User.find(query)
      .select("_id email storeName name verificationStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(sellers);
  } catch (error) {
    console.error("Error fetching all sellers:", error);
    return NextResponse.json(
      { error: "Failed to fetch sellers" },
      { status: 500 }
    );
  }
}
