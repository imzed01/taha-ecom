import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
// Product model is imported to ensure schema registration for populate operations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Product from "@/models/Product";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await dbConnect();

    const order = await Order.findById(id)
      .populate("productId", "title image price description")
      .populate("sellerId", "storeName");

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Return order details for customer tracking
    const orderDetails = {
      _id: order._id,
      productId: order.productId,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerPhone: order.buyerPhone,
      buyerAddress: order.buyerAddress,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json(orderDetails);
  } catch (error) {
    console.error("Error fetching order for tracking:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
