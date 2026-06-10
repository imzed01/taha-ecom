import mongoose from "mongoose";

export interface IWithdrawalRequest extends mongoose.Document {
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  transactionPin: string; // The PIN used for verification
  paymentMethod: "crypto" | "bank_account";
  paymentDetails: {
    // For crypto
    walletAddress?: string;
    cryptoType?: string;
    // For bank account
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  status: "pending" | "approved" | "rejected";
  adminNotes?: string; // Reason for rejection or approval notes
  processedAt?: Date;
  seenByAdmin?: boolean;
  seenBySeller?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalRequestSchema = new mongoose.Schema<IWithdrawalRequest>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    transactionPin: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["crypto", "bank_account"],
      required: true,
    },
    paymentDetails: {
      // Crypto details
      walletAddress: String,
      cryptoType: String,
      // Bank details
      bankName: String,
      accountNumber: String,
      accountHolderName: String,
      routingNumber: String,
      swiftCode: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
    },
    processedAt: {
      type: Date,
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

export default mongoose.models.WithdrawalRequest ||
  mongoose.model<IWithdrawalRequest>(
    "WithdrawalRequest",
    withdrawalRequestSchema
  );
