import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { rating } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const seller = await User.findById(id);

    if (!seller) {
      return NextResponse.json(
        { message: "Seller not found" },
        { status: 404 }
      );
    }

    if (seller.role !== "seller") {
      return NextResponse.json(
        { message: "User is not a seller" },
        { status: 400 }
      );
    }

    // Update the rating
    seller.rating = rating;
    seller.ratingCount = Math.max(seller.ratingCount || 0, 1); // Ensure at least 1 rating
    await seller.save();

    return NextResponse.json({
      message: "Rating updated successfully",
      rating: seller.rating,
      ratingCount: seller.ratingCount,
    });
  } catch (error) {
    console.error("Error updating seller rating:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    const seller = await User.findById(id).select("rating ratingCount");

    if (!seller) {
      return NextResponse.json(
        { message: "Seller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      rating: seller.rating,
      ratingCount: seller.ratingCount,
    });
  } catch (error) {
    console.error("Error fetching seller rating:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
