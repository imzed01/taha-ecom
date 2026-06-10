import { NextRequest, NextResponse } from "next/server";
import { getServerSessionWithAuth, checkAdminAuth } from "@/lib/auth-utils";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Wallet from "@/models/Wallet";
import WalletTransaction from "@/models/WalletTransaction";
import mongoose from "mongoose";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  console.log("=== Admin Order Status Update Started ===");

  try {
    // Validate session and admin auth
    const session = await getServerSessionWithAuth();
    if (!checkAdminAuth(session)) {
      console.log("❌ Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.log("✅ Admin authentication successful");

    // Validate params
    let id: string;
    try {
      const paramsData = await params;
      id = paramsData.id;
      if (!id || typeof id !== "string") {
        console.log("❌ Invalid order ID:", id);
        return NextResponse.json(
          { message: "Invalid order ID" },
          { status: 400 }
        );
      }
      console.log("✅ Order ID validated:", id);
    } catch (error) {
      console.error("❌ Error parsing params:", error);
      return NextResponse.json(
        { message: "Invalid request parameters" },
        { status: 400 }
      );
    }

    // Validate request body
    let requestBody: { status: string; itemIndex?: number };
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { status, itemIndex } = requestBody;

    // Validate status
    if (
      !status ||
      !["pending", "confirmed", "on_the_way", "delivered"].includes(status)
    ) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Validate status transition (optional business logic validation)
    if (status === "delivered") {
      // You might want to add business logic here to ensure order can be delivered
      console.log("Attempting to mark order as delivered");
    }

    // Validate itemIndex if provided
    if (
      itemIndex !== undefined &&
      (typeof itemIndex !== "number" || itemIndex < 0)
    ) {
      return NextResponse.json(
        { message: "Invalid item index" },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await dbConnect();

      // Verify connection is active
      if (mongoose.connection.readyState !== 1) {
        console.error(
          "MongoDB connection not ready. State:",
          mongoose.connection.readyState
        );
        return NextResponse.json(
          { message: "Database connection not ready" },
          { status: 500 }
        );
      }

      console.log("Database connection verified successfully");
    } catch (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { message: "Database connection failed" },
        { status: 500 }
      );
    }

    // Find and validate order
    let order;
    try {
      order = await Order.findById(id);
      if (!order) {
        return NextResponse.json(
          { message: "Order not found" },
          { status: 404 }
        );
      }

      // Log order details for debugging
      console.log("Found order:", {
        orderId: order._id,
        currentStatus: order.status,
        orderItemsCount: order.orderItems?.length || 0,
        totalAmount: order.totalAmount,
        sellerId: order.sellerId,
      });

      // Validate order structure
      if (!order.orderItems || !Array.isArray(order.orderItems)) {
        console.error("Order missing or invalid orderItems:", order._id);
        return NextResponse.json(
          { message: "Order has invalid structure" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error finding order:", error);
      return NextResponse.json(
        { message: "Error finding order" },
        { status: 500 }
      );
    }

    // Store original status for comparison
    const originalStatus = order.status;

    // Handle individual item status update if itemIndex is provided
    if (
      itemIndex !== undefined &&
      order.orderItems &&
      order.orderItems.length > itemIndex
    ) {
      try {
        // Validate item exists and has required properties
        const item = order.orderItems[itemIndex];
        if (!item || typeof item !== "object") {
          console.error(
            "Invalid item at index:",
            itemIndex,
            "for order:",
            order._id
          );
          return NextResponse.json(
            { message: "Invalid item at specified index" },
            { status: 400 }
          );
        }

        // Update specific item status
        order.orderItems[itemIndex].status = status;

        // Check if all items are now in the same status to update overall order status
        const allItemsSameStatus = order.orderItems.every(
          (item: { status?: string }) => (item.status || "pending") === status
        );

        if (allItemsSameStatus) {
          order.status = status;
        }

        console.log("Updated item status:", {
          orderId: order._id,
          itemIndex,
          newStatus: status,
          allItemsSameStatus,
          overallStatus: order.status,
        });
      } catch (error) {
        console.error("Error updating item status:", error);
        return NextResponse.json(
          { message: "Error updating item status" },
          { status: 500 }
        );
      }
    } else if (itemIndex !== undefined) {
      return NextResponse.json(
        { message: "Invalid item index" },
        { status: 400 }
      );
    } else {
      // Update overall order status (legacy behavior)
      order.status = status;

      // If updating to delivered, also update all individual items to delivered
      if (status === "delivered" && order.orderItems) {
        order.orderItems.forEach((item: { status?: string }) => {
          if (item && typeof item === "object") {
            item.status = "delivered";
          }
        });
      }
    }

    // If status is being changed to delivered, handle commission transfer
    if (status === "delivered" && originalStatus !== "delivered") {
      try {
        const sellerId = order.sellerId;
        if (!sellerId) {
          console.error("Order missing sellerId:", order._id);
          return NextResponse.json(
            { message: "Order missing seller information" },
            { status: 400 }
          );
        }

        // Get seller's wallet
        const wallet = await Wallet.findOne({ sellerId });
        if (!wallet) {
          console.error("Wallet not found for seller:", sellerId);
          return NextResponse.json(
            { message: "Seller wallet not found" },
            { status: 404 }
          );
        }

        // Validate order amounts
        if (typeof order.totalAmount !== "number" || order.totalAmount <= 0) {
          console.error("Invalid order total amount:", order.totalAmount);
          return NextResponse.json(
            { message: "Invalid order amount" },
            { status: 400 }
          );
        }

        // Check if commission field exists and is valid
        if (typeof order.commission !== "number" || order.commission < 0) {
          console.error(
            "Invalid order commission:",
            order.commission,
            "for order:",
            order._id
          );
          return NextResponse.json(
            { message: "Invalid order commission" },
            { status: 400 }
          );
        }

        // Use existing commission instead of recalculating
        const commission = order.commission;
        const sellerAmount = order.totalAmount + commission;

        console.log("Commission calculation:", {
          orderId: order._id,
          totalAmount: order.totalAmount,
          existingCommission: commission,
          sellerAmount,
          walletPendingBalance: wallet.pendingBalance,
        });

        // Validate wallet balances
        if (wallet.pendingBalance < sellerAmount) {
          console.error("Insufficient pending balance:", {
            sellerId,
            pendingBalance: wallet.pendingBalance,
            requiredAmount: sellerAmount,
            shortfall: sellerAmount - wallet.pendingBalance,
          });

          // Instead of failing, we could:
          // 1. Adjust the commission to match available balance
          // 2. Skip the commission transfer
          // 3. Log a warning and continue

          console.warn(
            "Insufficient pending balance for commission transfer. Proceeding with status update only."
          );

          // For now, let's skip the commission transfer and just update the status
          // The admin can handle the financial reconciliation separately
        } else {
          // Transfer from pending to available (pending contains product + commission)
          wallet.pendingBalance -= sellerAmount;
          wallet.balance += sellerAmount;
          wallet.totalEarned += sellerAmount;

          // Validate final balances
          if (wallet.pendingBalance < 0 || wallet.balance < 0) {
            console.error("Invalid wallet balance after update:", {
              sellerId,
              pendingBalance: wallet.pendingBalance,
              balance: wallet.balance,
            });
            return NextResponse.json(
              { message: "Invalid wallet balance calculation" },
              { status: 500 }
            );
          }

          await wallet.save();

          // Create transaction record for delivery
          const deliveryTransaction = new WalletTransaction({
            sellerId,
            type: "order_delivered",
            amount: sellerAmount,
            status: "completed",
            description: `Order delivered: ${
              order.buyerName || "Unknown Buyer"
            } + Commission: $${commission.toFixed(2)}`,
            orderId: order._id,
          });

          try {
            await deliveryTransaction.save();
            console.log(
              "Wallet transaction created successfully:",
              deliveryTransaction._id
            );
          } catch (transactionError) {
            console.error(
              "Error creating wallet transaction:",
              transactionError
            );
            // Don't fail the entire operation if transaction creation fails
            // Just log it and continue
          }

          console.log("Commission transfer completed:", {
            orderId: order._id,
            sellerId,
            commission,
            sellerAmount,
          });
        }
      } catch (error) {
        console.error("Error processing commission transfer:", error);
        return NextResponse.json(
          { message: "Error processing commission transfer" },
          { status: 500 }
        );
      }
    }

    // Save order
    try {
      const savedOrder = await order.save();

      // Validate the saved order
      if (!savedOrder) {
        console.error("Order save returned null for order:", order._id);
        return NextResponse.json(
          { message: "Error saving order - save operation failed" },
          { status: 500 }
        );
      }

      const executionTime = Date.now() - startTime;
      console.log(
        `✅ Order status updated successfully in ${executionTime}ms:`,
        {
          orderId: savedOrder._id,
          newStatus: savedOrder.status,
          itemIndex,
        }
      );

      // Return the saved order instead of the original
      return NextResponse.json(
        { message: "Order status updated successfully", order: savedOrder },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error saving order:", error);

      // Check if it's a validation error
      if (error instanceof Error && error.name === "ValidationError") {
        return NextResponse.json(
          { message: "Order validation failed", error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "Error saving order" },
        { status: 500 }
      );
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(
      `❌ Unexpected error updating order status after ${executionTime}ms:`,
      error
    );
    return NextResponse.json(
      {
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
