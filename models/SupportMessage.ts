import { Schema, Document, models, model } from "mongoose";

export interface ISupportMessage extends Document {
  senderId: string;
  senderRole: "seller" | "admin";
  receiverId: string;
  message: string;
  image?: string; // Base64 encoded image
  createdAt: Date;
  seenByAdmin?: boolean;
  seenBySeller?: boolean;
}

const SupportMessageSchema = new Schema<ISupportMessage>({
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ["seller", "admin"], required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true, default: "" },
  image: { type: String }, // Optional base64 encoded image
  createdAt: { type: Date, default: Date.now },
  seenByAdmin: { type: Boolean, default: false },
  seenBySeller: { type: Boolean, default: false },
});

export default models.SupportMessage ||
  model<ISupportMessage>("SupportMessage", SupportMessageSchema);
