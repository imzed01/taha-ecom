import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkAdminAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const orders = await Order.find()
      .populate("sellerId", "storeName email")
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
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

    const {
      sellerId,
      orderItems,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
    } = await request.json();

    if (
      !sellerId ||
      !orderItems ||
      !Array.isArray(orderItems) ||
      orderItems.length === 0 ||
      !buyerName ||
      !buyerEmail ||
      !buyerPhone ||
      !buyerAddress
    ) {
      return NextResponse.json(
        {
          message:
            "All fields are required and orderItems must be a non-empty array",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Validate and process each order item
    const processedOrderItems = [];
    let totalAmount = 0;

    for (const item of orderItems) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { message: "Invalid order item data" },
          { status: 400 }
        );
      }

      // Get product details
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { message: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      processedOrderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        title: product.title,
        image: product.image,
      });
    }

    // Calculate commission (15% of total amount)
    const commission = totalAmount * 0.15;

    const order = new Order({
      sellerId,
      orderItems: processedOrderItems,
      totalAmount,
      commission,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      status: "pending",
      paymentStatus: "pending",
    });

    await order.save();

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
