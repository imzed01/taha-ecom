// Script to remove test orders from the database
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

const orderSchema = new mongoose.Schema({
  buyerName: String,
}, { strict: false });

const Order = mongoose.model('Order', orderSchema, 'orders');

async function removeTestOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Order.deleteMany({
      buyerName: { $in: ['John Doe', 'Jane Smith', 'Bob Johnson'] }
    });

    console.log(`Removed ${result.deletedCount} test orders.`);
  } catch (error) {
    console.error('Error removing test orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

removeTestOrders(); 