import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();
    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const sellerUser = await User.findById(
      (session as { user: { id: string } }).user.id
    );
    if (!sellerUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      email: sellerUser.email,
      storeName: sellerUser.storeName,
    });
  } catch (error) {
    console.error("Error fetching seller settings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();
    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { storeName } = await request.json();
    if (!storeName || typeof storeName !== "string") {
      return NextResponse.json(
        { message: "Invalid store name" },
        { status: 400 }
      );
    }
    await dbConnect();
    const sellerUser = await User.findById(
      (session as { user: { id: string } }).user.id
    );
    if (!sellerUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    sellerUser.storeName = storeName;
    await sellerUser.save();
    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating seller settings:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
