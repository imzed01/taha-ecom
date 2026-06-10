import mongoose from "mongoose";

export interface IWalletTransaction extends mongoose.Document {
  sellerId: mongoose.Types.ObjectId;
  type:
    | "topup"
    | "withdrawal"
    | "commission"
    | "order_payment"
    | "funding_request"
    | "order_processing"
    | "order_delivered"
    | "admin_adjustment_add"
    | "admin_adjustment_deduct";
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  description: string;
  proofImage?: string;
  transactionId?: string;
  adminNotes?: string;
  orderId?: mongoose.Types.ObjectId;
  seenByAdmin?: boolean;
  seenBySeller?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new mongoose.Schema<IWalletTransaction>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "topup",
        "withdrawal",
        "commission",
        "order_payment",
        "funding_request",
        "order_processing",
        "order_delivered",
        "admin_adjustment_add",
        "admin_adjustment_deduct",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    description: {
      type: String,
      required: true,
    },
    proofImage: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    seenByAdmin: {
      type: Boolean,
      default: false,
    },
    seenBySeller: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Clear existing model to force refresh
if (mongoose.models.WalletTransaction) {
  delete mongoose.models.WalletTransaction;
}

export default mongoose.model<IWalletTransaction>(
  "WalletTransaction",
  walletTransactionSchema
);
