import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const sellers = await User.find({ role: "seller" })
      .select("-idImageFront -idImageBack")
      .sort({ createdAt: -1 }); // Sort by most recent first

    // Add shorter caching headers to ensure real-time updates
    const response = NextResponse.json(sellers);
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60"); // 1 minute cache

    return response;
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
