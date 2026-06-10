import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SellerProduct from "@/models/SellerProduct";

export async function GET() {
  try {
    await dbConnect();

    // Get all active seller products with populated product and seller info
    const sellerProducts = await SellerProduct.find({ isActive: true })
      .populate({
        path: "productId",
        match: { isActive: true },
      })
      .populate({
        path: "sellerId",
        select: "storeName verificationStatus",
        match: { verificationStatus: "verified" },
      })
      .sort({ createdAt: -1 });

    // Filter out products where either product or seller is not active/verified
    const validProducts = sellerProducts
      .filter((sp) => sp.productId && sp.sellerId)
      .map((sp) => ({
        _id: sp.productId._id,
        title: sp.productId.title,
        description: sp.productId.description,
        price: sp.productId.price,
        image: sp.productId.image,
        category: sp.productId.category,
        sellerId: {
          _id: sp.sellerId._id,
          storeName: sp.sellerId.storeName,
        },
        // TODO: Add rating and review count when implemented
        rating: 4.5, // Placeholder
        reviewCount: 12, // Placeholder
      }));

    return NextResponse.json(validProducts);
  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
