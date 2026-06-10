import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom?retryWrites=true&w=majority";

async function fixOrderStatusValues() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;
    
    // Find all orders
    const orders = await db.collection('orders').find({}).toArray();
    console.log(`📦 Found ${orders.length} orders to fix`);

    let updatedCount = 0;

    for (const order of orders) {
      if (order.orderItems && order.orderItems.length > 0) {
        // Create update operations for each order item
        const updateOperations = {
          $set: {}
        };

        order.orderItems.forEach((item, index) => {
          // Set status to the overall order status or 'pending' as default
          updateOperations.$set[`orderItems.${index}.status`] = order.status || 'pending';
          // Set paymentStatus to the overall order paymentStatus or 'pending' as default
          updateOperations.$set[`orderItems.${index}.paymentStatus`] = order.paymentStatus || 'pending';
        });

        // Update the order
        await db.collection('orders').updateOne(
          { _id: order._id },
          updateOperations
        );
        
        updatedCount++;
        console.log(`✅ Fixed order ${order._id} with ${order.orderItems.length} items`);
      }
    }

    console.log(`\n🎉 Status values fixed!`);
    console.log(`📊 Updated: ${updatedCount} orders`);

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run fix
fixOrderStatusValues(); 