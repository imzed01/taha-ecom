import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkSellerAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Wallet from "@/models/Wallet";
import WalletTransaction from "@/models/WalletTransaction";
import User from "@/models/User";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWithAuth();

    if (!checkSellerAuth(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    let transactionPin;
    try {
      const body = await request.text();
      console.log("Raw request body:", body);
      if (!body) {
        return NextResponse.json(
          { error: "Missing request body" },
          { status: 400 }
        );
      }
      const parsed = JSON.parse(body);
      transactionPin = parsed.transactionPin;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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

    // Find the order and verify it belongs to this seller
    const order = await Order.findById(originalOrderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("Debug order details:", {
      orderId: order._id,
      sellerId: order.sellerId,
      requestedSellerId: sellerId,
      orderStatus: order.status,
      orderItems: order.orderItems,
      itemIndex,
    });

    if (order.sellerId.toString() !== sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the specific order item if this is a separated order
    let orderItem;
    if (
      id.includes("_item_") &&
      order.orderItems &&
      order.orderItems.length > itemIndex
    ) {
      orderItem = order.orderItems[itemIndex];
    } else {
      // If no specific item, use the first item or calculate total
      orderItem =
        order.orderItems && order.orderItems.length > 0
          ? order.orderItems[0]
          : null;
    }

    console.log("Debug order item details:", {
      orderId: order._id,
      itemIndex,
      totalOrderItems: order.orderItems?.length || 0,
      selectedOrderItem: orderItem,
      orderItemPrice: orderItem?.price,
      orderItemQuantity: orderItem?.quantity,
      orderItemStatus: orderItem?.status,
      orderItemPaymentStatus: orderItem?.paymentStatus,
    });

    if (!orderItem) {
      console.log("Order item not found:", {
        orderId: order._id,
        itemIndex,
        orderItems: order.orderItems,
      });
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 400 }
      );
    }

    // Check if the specific item is in pending status
    if ((orderItem.status || "pending") !== "pending") {
      console.log("Order item status validation failed:", {
        orderId: order._id,
        itemIndex,
        currentStatus: orderItem.status || "pending",
        expectedStatus: "pending",
      });
      return NextResponse.json(
        { error: "Order item is not in pending status" },
        { status: 400 }
      );
    }

    // Calculate the amount for this specific item
    const itemAmount = orderItem.price * orderItem.quantity;

    // Validate transaction pin
    const user = await User.findById(sellerId);
    if (!user || !user.transactionPin) {
      return NextResponse.json(
        { error: "No transaction PIN set for this seller" },
        { status: 400 }
      );
    }
    const storedPin = String(user.transactionPin).trim();
    const submittedPin = String(transactionPin || "").trim();

    console.log("Debug PIN verification (proceed order):", {
      userId: sellerId,
      userFound: !!user,
      storedPin: user?.transactionPin,
      submittedPin: transactionPin,
      pinType: typeof user?.transactionPin,
      submittedPinType: typeof transactionPin,
      pinsMatch: user?.transactionPin === transactionPin,
      userEmail: user?.email,
      userRole: user?.role,
      storedPinNormalized: storedPin,
      submittedPinNormalized: submittedPin,
      normalizedPinsMatch: storedPin === submittedPin,
    });

    if (!transactionPin || storedPin !== submittedPin) {
      return NextResponse.json(
        { error: "Invalid transaction PIN" },
        { status: 400 }
      );
    }

    // Get seller's wallet
    let wallet = await Wallet.findOne({ sellerId });
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = new Wallet({
        sellerId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
      });
      await wallet.save();
    }

    // Check if seller has sufficient balance for this item
    if (wallet.balance < itemAmount) {
      return NextResponse.json(
        {
          error: "Insufficient funds",
          message: "Please add funds to your wallet to proceed with this order",
          requiredAmount: itemAmount,
          availableBalance: wallet.balance,
        },
        { status: 400 }
      );
    }

    // Calculate commission (15% of item amount)
    const commission = itemAmount * 0.15;
    const sellerAmount = itemAmount + commission;

    // Deduct item amount from available balance
    wallet.balance -= itemAmount;
    // Add total amount (item + commission) to pending balance
    wallet.pendingBalance += sellerAmount;
    await wallet.save();

    // Create transaction record for deduction
    const deductionTransaction = new WalletTransaction({
      sellerId,
      type: "order_processing",
      amount: itemAmount,
      status: "completed",
      description: `Order Item: $${itemAmount} + Commission: $${commission.toFixed(
        2
      )} = Pending: $${sellerAmount.toFixed(2)}`,
      orderId: order._id,
    });
    await deductionTransaction.save();

    // Update only the specific order item status, not the entire order
    try {
      if (
        id.includes("_item_") &&
        order.orderItems &&
        order.orderItems.length > itemIndex
      ) {
        // Update specific item status - use markModified to ensure Mongoose detects the change
        order.orderItems[itemIndex].status = "confirmed";
        order.orderItems[itemIndex].paymentStatus = "paid";

        // Mark the orderItems array as modified to ensure Mongoose saves the changes
        order.markModified("orderItems");

        console.log("Updated specific item:", {
          itemIndex,
          newStatus: order.orderItems[itemIndex].status,
          newPaymentStatus: order.orderItems[itemIndex].paymentStatus,
        });
      } else {
        // If no specific item index, update the first item
        if (order.orderItems && order.orderItems.length > 0) {
          order.orderItems[0].status = "confirmed";
          order.orderItems[0].paymentStatus = "paid";

          // Mark the orderItems array as modified
          order.markModified("orderItems");

          console.log("Updated first item:", {
            newStatus: order.orderItems[0].status,
            newPaymentStatus: order.orderItems[0].paymentStatus,
          });
        }
      }

      // Check if all items are now confirmed to update overall order status
      const allItemsConfirmed = order.orderItems?.every(
        (item: { status?: string }) =>
          (item.status || "pending") === "confirmed"
      );
      const allItemsPaid = order.orderItems?.every(
        (item: { paymentStatus?: string }) =>
          (item.paymentStatus || "pending") === "paid"
      );

      console.log("Status check results:", {
        allItemsConfirmed,
        allItemsPaid,
        totalItems: order.orderItems?.length,
        itemStatuses: order.orderItems?.map(
          (item: { status?: string; paymentStatus?: string }) => ({
            status: item.status || "pending",
            paymentStatus: item.paymentStatus || "pending",
          })
        ),
      });

      if (allItemsConfirmed) {
        order.status = "confirmed";
      }
      if (allItemsPaid) {
        order.paymentStatus = "paid";
      }

      console.log("Saving order with status:", {
        overallStatus: order.status,
        overallPaymentStatus: order.paymentStatus,
      });

      await order.save();
      console.log("Order saved successfully");

      // Verify the save worked by checking the updated order
      const updatedOrder = await Order.findById(order._id);
      if (updatedOrder) {
        console.log("Verification - Updated order item statuses:", {
          item0Status: updatedOrder.orderItems[0]?.status,
          item0PaymentStatus: updatedOrder.orderItems[0]?.paymentStatus,
          item1Status: updatedOrder.orderItems[1]?.status,
          item1PaymentStatus: updatedOrder.orderItems[1]?.paymentStatus,
        });
      }
    } catch (saveError) {
      console.error("Error saving order:", saveError);
      const errorMessage =
        saveError instanceof Error ? saveError.message : "Unknown error";
      return NextResponse.json(
        { error: "Failed to update order status", details: errorMessage },
        { status: 500 }
      );
    }

    // Return the updated order without populate to avoid schema registration issues
    return NextResponse.json({
      message: "Order processed successfully",
      order: {
        ...order.toObject(),
        _id: id, // Return the separated order ID that was requested, not the original order ID
        originalOrderId: order._id.toString(), // Include the original order ID for reference
      },
      wallet: {
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
      },
    });
  } catch (error) {
    console.error("Error processing order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
