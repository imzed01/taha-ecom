// remove-all-test-orders.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

const productSchema = new mongoose.Schema({ title: String }, { strict: false });
const orderSchema = new mongoose.Schema({ buyerName: String, productId: mongoose.Schema.Types.ObjectId }, { strict: false });

const Product = mongoose.model('Product', productSchema, 'products');
const Order = mongoose.model('Order', orderSchema, 'orders');

const testBuyerNames = ['John Doe', 'Jane Smith', 'Bob Johnson'];
const testProductTitles = [
  'Wireless Bluetooth Headphones', 'Smartphone Case', 'Laptop Stand', 'Wireless Mouse', 'USB-C Cable',
  'Mechanical Keyboard', 'Gaming Headset', 'Phone Stand', 'Power Bank', 'Screen Protector',
  'Bluetooth Speaker', 'Cable Organizer', 'Webcam', 'Desk Lamp', 'Wireless Charger'
];

async function removeAllTestOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove by buyer name
    const byName = await Order.deleteMany({ buyerName: { $in: testBuyerNames } });
    console.log(`Removed ${byName.deletedCount} orders by test buyer names.`);

    // Remove by product title
    const testProducts = await Product.find({ title: { $in: testProductTitles } });
    const testProductIds = testProducts.map(p => p._id);
    if (testProductIds.length > 0) {
      const byProduct = await Order.deleteMany({ productId: { $in: testProductIds } });
      console.log(`Removed ${byProduct.deletedCount} orders referencing test products.`);
    } else {
      console.log('No test products found.');
    }
  } catch (error) {
    console.error('Error removing test orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

removeAllTestOrders(); 