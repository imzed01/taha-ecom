import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  email: string;
  password: string; // hashed password for authentication
  plainPassword?: string; // plain text password for admin visibility
  transactionPin?: string; // plain text, required for sellers
  role: "admin" | "seller";
  username?: string; // username for sellers
  storeName?: string;
  idImageFront?: string;
  idImageBack?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  referralCode?: string; // Referral code used during signup
  rating?: number; // 5-star rating for sellers (1-5)
  ratingCount?: number; // Number of ratings received
  isBlocked?: boolean; // Admin can block/unblock sellers
  blockedReason?: string; // Reason for blocking
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    plainPassword: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
    },
    transactionPin: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
    },
    role: {
      type: String,
      enum: ["admin", "seller"],
      required: true,
    },
    username: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
      unique: true,
      lowercase: true,
      trim: true,
    },
    storeName: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
    },
    idImageFront: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
    },
    idImageBack: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
    referralCode: {
      type: String,
      required: function () {
        return this.role === "seller";
      },
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
      required: function () {
        return this.role === "seller";
      },
    },
    ratingCount: {
      type: Number,
      default: 0,
      required: function () {
        return this.role === "seller";
      },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);
