import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Handle separated order IDs (format: originalOrderId_item_index)
    let originalOrderId = id;
    let itemIndex = 0;

    if (id.includes("_item_")) {
      const parts = id.split("_item_");
      originalOrderId = parts[0];
      itemIndex = parseInt(parts[1]) || 0;
    }

    const order = await Order.findOne({
      _id: originalOrderId,
      sellerId,
    }).populate("sellerId", "storeName email");

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Privacy protection functions
    const maskEmail = (email: string) => {
      const [localPart, domain] = email.split("@");
      if (localPart.length <= 2) return email;
      return (
        localPart.charAt(0) +
        "*".repeat(localPart.length - 2) +
        localPart.charAt(localPart.length - 1) +
        "@" +
        domain
      );
    };

    const maskPhone = (phone: string) => {
      if (phone.length <= 4) return phone;
      return "*".repeat(phone.length - 4) + phone.slice(-4);
    };

    const maskName = (name: string) => {
      const parts = name.split(" ");
      return parts
        .map((part) => {
          if (part.length <= 2) return part;
          return (
            part.charAt(0) +
            "*".repeat(part.length - 2) +
            part.charAt(part.length - 1)
          );
        })
        .join(" ");
    };

    const maskAddress = (address: string) => {
      const words = address.split(" ");
      return words
        .map((word, index) => {
          if (index === 0 || word.length <= 2) return word;
          return word.charAt(0) + "*".repeat(word.length - 1);
        })
        .join(" ");
    };

    // Get the specific item if this is a separated order
    let orderItems = order.orderItems || [];
    let itemTotalAmount = order.totalAmount;
    let itemCommission = order.commission;

    if (id.includes("_item_") && orderItems.length > itemIndex) {
      orderItems = [orderItems[itemIndex]];
      // Calculate totals for this specific item only
      const specificItem = orderItems[0];
      itemTotalAmount =
        Number(specificItem.price) * Number(specificItem.quantity);
      itemCommission = itemTotalAmount * 0.15; // 15% commission
    }

    // Create order number for this specific order/item
    const orderNumber = id.includes("_item_")
      ? `${originalOrderId.slice(-8)}-${String(itemIndex + 1).padStart(2, "0")}`
      : `${originalOrderId.slice(-8)}-01`;

    // Create privacy-protected order object
    const protectedOrder = {
      ...order.toObject(),
      _id: id, // Use the requested ID (might be separated)
      orderNumber: orderNumber,
      originalOrderId: originalOrderId,
      totalAmount: itemTotalAmount, // Use item-specific total
      commission: itemCommission, // Use item-specific commission
      orderItems: orderItems.map((item: Record<string, unknown>) => {
        return {
          productId: item.productId as string,
          quantity: Number(item.quantity) || 0,
          title: (item.title as string) || "Unknown Product",
          image: (item.image as string) || "",
          price: Number(item.price) || 0,
          description: (item.description as string) || "",
        };
      }),
      buyerName: maskName(order.buyerName),
      buyerEmail: maskEmail(order.buyerEmail),
      buyerPhone: maskPhone(order.buyerPhone),
      buyerAddress: maskAddress(order.buyerAddress),
    };

    return NextResponse.json(protectedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
