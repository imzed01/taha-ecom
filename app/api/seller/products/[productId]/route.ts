import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import SellerProduct from "@/models/SellerProduct";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    const sellerProduct = await SellerProduct.findOne({
      sellerId,
      productId,
    });

    if (!sellerProduct) {
      return NextResponse.json(
        { message: "Product not found in your store" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    sellerProduct.isActive = false;
    await sellerProduct.save();

    return NextResponse.json({ message: "Product removed from store" });
  } catch (error) {
    console.error("Error removing product from seller store:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
