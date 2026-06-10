import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    const category = searchParams.get("category");
    const categoriesCsv = searchParams.get("categories");
    const q = searchParams.get("q");

    // Build filter for category and search
    const filter: Record<string, unknown> = { isActive: true };
    if (categoriesCsv && categoriesCsv.trim().length > 0) {
      const list = categoriesCsv
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (list.length > 0) {
        filter.category = { $in: list };
      }
    } else if (category && category !== "all") {
      filter.category = category;
    }
    if (q && q.trim().length > 0) {
      filter.title = { $regex: q.trim(), $options: "i" };
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
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
