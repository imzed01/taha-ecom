import mongoose from "mongoose";

export interface IReferralCode extends mongoose.Document {
  code: string;
  isUsed: boolean;
  usedBy?: {
    sellerId: mongoose.Types.ObjectId;
    sellerEmail: string;
    sellerStoreName: string;
    usedAt: Date;
  };
  generatedBy: mongoose.Types.ObjectId; // Admin who generated the code
  createdAt: Date;
  updatedAt: Date;
}

const referralCodeSchema = new mongoose.Schema<IReferralCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      length: 6,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sellerEmail: String,
      sellerStoreName: String,
      usedAt: Date,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
referralCodeSchema.index({ code: 1 });
referralCodeSchema.index({ isUsed: 1 });
referralCodeSchema.index({ generatedBy: 1 });

export default mongoose.models.ReferralCode ||
  mongoose.model<IReferralCode>("ReferralCode", referralCodeSchema);
