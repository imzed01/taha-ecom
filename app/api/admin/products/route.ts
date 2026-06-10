import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find()
        .populate("sellerId", "storeName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(),
    ]);

    return NextResponse.json({ products, total });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { title, description, price, image, category, isActive } = body;

    if (!title || !description || !price || !image || !category) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { message: "Price must be a positive number" },
        { status: 400 }
      );
    }

    const product = new Product({
      title,
      description,
      price: Number(price),
      image,
      category,
      sellerId: null, // Admin products don't have a seller
      isActive: isActive !== undefined ? isActive : true,
    });

    await product.save();

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
