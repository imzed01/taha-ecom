import mongoose from "mongoose";

export interface ISellerProduct extends mongoose.Document {
  sellerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sellerProductSchema = new mongoose.Schema<ISellerProduct>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique combination of seller and product
sellerProductSchema.index({ sellerId: 1, productId: 1 }, { unique: true });

export default mongoose.models.SellerProduct ||
  mongoose.model<ISellerProduct>("SellerProduct", sellerProductSchema);
