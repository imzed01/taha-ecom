import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom?retryWrites=true&w=majority";

// Define the Order schema for checking images
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

async function checkOrderImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all orders
    const orders = await Order.find({}).limit(10);
    console.log(`\n📊 Found ${orders.length} orders to check:`);
    
    for (const order of orders) {
      console.log(`\n📦 Order ID: ${order._id}`);
      console.log(`   Buyer: ${order.buyerName}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Order Items: ${order.orderItems.length}`);
      
      order.orderItems.forEach((item, index) => {
        console.log(`   Item ${index + 1}:`);
        console.log(`     Title: ${item.title}`);
        console.log(`     Price: $${item.price}`);
        console.log(`     Quantity: ${item.quantity}`);
        console.log(`     Image URL: ${item.image}`);
        
        // Check if image URL is valid
        if (item.image) {
          try {
            const url = new URL(item.image);
            console.log(`     ✅ Valid URL - Protocol: ${url.protocol}, Host: ${url.hostname}`);
          } catch (error) {
            console.log(`     ❌ Invalid URL format: ${error.message}`);
          }
        } else {
          console.log(`     ❌ No image URL`);
        }
      });
    }

    // Check for orders with missing or invalid image URLs
    const ordersWithImageIssues = orders.filter(order => 
      order.orderItems.some(item => !item.image || item.image.trim() === '')
    );
    
    if (ordersWithImageIssues.length > 0) {
      console.log(`\n⚠️  Found ${ordersWithImageIssues.length} orders with image issues:`);
      ordersWithImageIssues.forEach(order => {
        console.log(`   Order ${order._id}: ${order.orderItems.filter(item => !item.image).length} items without images`);
      });
    } else {
      console.log('\n✅ All checked orders have image URLs');
    }

    // Check for common image URL patterns
    const imageUrls = orders.flatMap(order => 
      order.orderItems.map(item => item.image).filter(Boolean)
    );
    
    if (imageUrls.length > 0) {
      console.log('\n🔍 Image URL Analysis:');
      const urlPatterns = imageUrls.map(url => {
        try {
          const parsed = new URL(url);
          return parsed.hostname;
        } catch {
          return 'invalid';
        }
      });
      
      const patternCounts = urlPatterns.reduce((acc, pattern) => {
        acc[pattern] = (acc[pattern] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(patternCounts).forEach(([pattern, count]) => {
        console.log(`   ${pattern}: ${count} images`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking order images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkOrderImages(); 