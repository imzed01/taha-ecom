import mongoose from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  title: string;
  image: string;
  status: "pending" | "confirmed" | "on_the_way" | "delivered";
  paymentStatus: "pending" | "paid" | "failed";
}

export interface IOrder extends mongoose.Document {
  sellerId: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  totalAmount: number;
  commission: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  status: "pending" | "confirmed" | "on_the_way" | "delivered";
  paymentStatus: "pending" | "paid" | "failed";
  transactionId?: string;
  seenBySeller: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema<IOrderItem>({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "on_the_way", "delivered"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
});

const orderSchema = new mongoose.Schema<IOrder>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items: IOrderItem[]) {
          return items && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
    },
    buyerName: {
      type: String,
      required: true,
    },
    buyerEmail: {
      type: String,
      required: true,
    },
    buyerPhone: {
      type: String,
      required: true,
    },
    buyerAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "on_the_way", "delivered"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
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

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", orderSchema);
