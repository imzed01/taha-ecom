import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function updateExistingOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the database
    const db = mongoose.connection.db;
    
    // Update all existing orders to have seenBySeller: false
    const result = await db.collection('orders').updateMany(
      { seenBySeller: { $exists: false } },
      { $set: { seenBySeller: false } }
    );

    console.log(`Updated ${result.modifiedCount} orders with seenBySeller field`);

    // Verify the update
    const totalOrders = await db.collection('orders').countDocuments();
    const ordersWithSeenField = await db.collection('orders').countDocuments({ seenBySeller: { $exists: true } });
    
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Orders with seenBySeller field: ${ordersWithSeenField}`);

    console.log('✅ Successfully updated existing orders');
  } catch (error) {
    console.error('❌ Error updating orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateExistingOrders(); 