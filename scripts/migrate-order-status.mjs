import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom?retryWrites=true&w=majority";

// Define the Order schema for migration
const orderItemSchema = new mongoose.Schema({
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

const orderSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function (items) {
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
  transactionId: String,
  seenBySeller: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

async function migrateOrderStatus() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all orders
    const orders = await Order.find({});
    console.log(`📦 Found ${orders.length} orders to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      let needsUpdate = false;
      
      // Check if order items need status fields
      if (order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          if (!item.status || !item.paymentStatus) {
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        // Update order items with default status values
        if (order.orderItems && order.orderItems.length > 0) {
          for (const item of order.orderItems) {
            if (!item.status) {
              item.status = order.status || "pending";
            }
            if (!item.paymentStatus) {
              item.paymentStatus = order.paymentStatus || "pending";
            }
          }
        }

        await order.save();
        updatedCount++;
        console.log(`✅ Updated order ${order._id}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Updated: ${updatedCount} orders`);
    console.log(`⏭️  Skipped: ${skippedCount} orders (already up to date)`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrateOrderStatus(); 