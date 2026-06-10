import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom?retryWrites=true&w=majority";

async function forceUpdateOrderSchema() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;
    
    // Find all orders
    const orders = await db.collection('orders').find({}).toArray();
    console.log(`📦 Found ${orders.length} orders to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      let needsUpdate = false;
      
      // Check if order items need the new fields
      if (order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          if (!item.hasOwnProperty('status') || !item.hasOwnProperty('paymentStatus')) {
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        // Update each order item to include the new fields
        const updateOperations = {
          $set: {}
        };

        if (order.orderItems && order.orderItems.length > 0) {
          order.orderItems.forEach((item, index) => {
            if (!item.hasOwnProperty('status')) {
              updateOperations.$set[`orderItems.${index}.status`] = order.status || 'pending';
            }
            if (!item.hasOwnProperty('paymentStatus')) {
              updateOperations.$set[`orderItems.${index}.paymentStatus`] = order.paymentStatus || 'pending';
            }
          });
        }

        // Only update if there are actual changes to make
        if (Object.keys(updateOperations.$set).length > 0) {
          await db.collection('orders').updateOne(
            { _id: order._id },
            updateOperations
          );
          updatedCount++;
          console.log(`✅ Updated order ${order._id}`);
        } else {
          skippedCount++;
        }
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
forceUpdateOrderSchema(); 