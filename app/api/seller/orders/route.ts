import { NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";

import Order from "@/models/Order";

interface SeparatedOrder {
  _id: string;
  orderNumber: string;
  originalOrderId: string;
  sellerId: string;
  orderItems: Array<{
    productId: string;
    quantity: number;
    title: string;
    image: string;
    price: number;
  }>;
  totalAmount: number;
  commission: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  status: string;
  paymentStatus: string;
  seenBySeller: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
      await dbConnect();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { message: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }

    const sellerId = (session as { user: { id: string } }).user.id;

    // Fetch orders without populate to avoid schema registration issues
    // Product data is already stored in orderItems
    const orders = await Order.find({ sellerId }).sort({ createdAt: -1 });

    // Separate multi-item orders into individual orders with proper order numbers
    const separatedOrders: SeparatedOrder[] = [];

    orders.forEach((order) => {
      const orderData = order.toObject();

      if (orderData.orderItems && orderData.orderItems.length > 0) {
        // Create separate order for each item with proper order number
        orderData.orderItems.forEach(
          (item: Record<string, unknown>, index: number) => {
            // Create a proper order number based on original order ID and item index
            const orderNumber = `${orderData._id.toString().slice(-8)}-${String(
              index + 1
            ).padStart(2, "0")}`;

            const separatedOrder: SeparatedOrder = {
              _id: `${orderData._id.toString()}_item_${index}`,
              orderNumber: orderNumber,
              originalOrderId: orderData._id.toString(),
              sellerId: orderData.sellerId.toString(),
              orderItems: [
                {
                  productId: item.productId as string,
                  quantity: Number(item.quantity) || 0,
                  title: (item.title as string) || "Unknown Product",
                  image: (item.image as string) || "",
                  price: Number(item.price) || 0,
                },
              ],
              totalAmount: Number(item.price) * Number(item.quantity) || 0,
              commission:
                Number(item.price) * Number(item.quantity) * 0.15 || 0,
              buyerName: orderData.buyerName,
              buyerEmail: orderData.buyerEmail,
              buyerPhone: orderData.buyerPhone,
              buyerAddress: orderData.buyerAddress,
              status: (item.status as string) || orderData.status || "pending",
              paymentStatus:
                (item.paymentStatus as string) ||
                orderData.paymentStatus ||
                "pending",
              seenBySeller: orderData.seenBySeller,
              createdAt: orderData.createdAt,
              updatedAt: orderData.updatedAt,
            };

            separatedOrders.push(separatedOrder);
          }
        );
      } else {
        // Handle orders with no items
        const orderNumber = `${orderData._id.toString().slice(-8)}-01`;
        const emptyOrder: SeparatedOrder = {
          _id: orderData._id.toString(),
          orderNumber: orderNumber,
          originalOrderId: orderData._id.toString(),
          sellerId: orderData.sellerId.toString(),
          orderItems: [],
          totalAmount: orderData.totalAmount,
          commission: orderData.commission,
          buyerName: orderData.buyerName,
          buyerEmail: orderData.buyerEmail,
          buyerPhone: orderData.buyerPhone,
          buyerAddress: orderData.buyerAddress,
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          seenBySeller: orderData.seenBySeller,
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt,
        };

        separatedOrders.push(emptyOrder);
      }
    });

    return NextResponse.json(separatedOrders);
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
