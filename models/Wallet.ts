import mongoose from "mongoose";

export interface IWallet extends mongoose.Document {
  sellerId: mongoose.Types.ObjectId;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new mongoose.Schema<IWallet>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Wallet ||
  mongoose.model<IWallet>("Wallet", walletSchema);
