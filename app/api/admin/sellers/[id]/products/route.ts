import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import SellerProduct from "@/models/SellerProduct";
// Product model is imported to ensure schema registration for populate operations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Product from "@/models/Product";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the seller ID from the URL params
    const { id: sellerId } = await params;

    // Find all products that this seller has added to their store
    const sellerProducts = await SellerProduct.find({
      sellerId: sellerId,
      isActive: true,
    }).populate("productId");

    // Extract the actual product data
    const products = sellerProducts.map((sp) => ({
      _id: sp.productId._id,
      title: sp.productId.title,
      price: sp.productId.price,
      image: sp.productId.image,
      description: sp.productId.description,
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
