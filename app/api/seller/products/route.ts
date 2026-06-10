import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import SellerProduct from "@/models/SellerProduct";
import Product from "@/models/Product";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    const sellerProducts = await SellerProduct.find({ sellerId })
      .populate("productId")
      .sort({ createdAt: -1 });

    return NextResponse.json(sellerProducts);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (session as any).user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Check if seller already has this product
    const existingSellerProduct = await SellerProduct.findOne({
      sellerId,
      productId,
    });

    if (existingSellerProduct) {
      if (existingSellerProduct.isActive) {
        return NextResponse.json(
          { message: "Product already in your store" },
          { status: 400 }
        );
      } else {
        // Reactivate the product
        existingSellerProduct.isActive = true;
        await existingSellerProduct.save();
        return NextResponse.json(existingSellerProduct);
      }
    }

    // Create new seller product
    const sellerProduct = new SellerProduct({
      sellerId,
      productId,
      isActive: true,
    });

    await sellerProduct.save();

    return NextResponse.json(sellerProduct, { status: 201 });
  } catch (error) {
    console.error("Error adding product to seller store:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
