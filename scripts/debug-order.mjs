import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom?retryWrites=true&w=majority";

async function debugOrder() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import models
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const Wallet = mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }));

    // Test the specific order ID from the error
    const orderId = '68a4b8794dc8ebd3aa651ec9';
    console.log(`\n=== Debugging Order: ${orderId} ===`);

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('❌ Order not found');
      return;
    }

    console.log('✅ Order found');
    console.log('Order details:', {
      _id: order._id,
      status: order.status,
      totalAmount: order.totalAmount,
      commission: order.commission,
      sellerId: order.sellerId,
      buyerName: order.buyerName,
      orderItemsCount: order.orderItems?.length || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });

    // Check order items
    if (order.orderItems && order.orderItems.length > 0) {
      console.log('\nOrder Items:');
      order.orderItems.forEach((item, index) => {
        console.log(`  Item ${index}:`, {
          productId: item.productId,
          title: item.title,
          status: item.status,
          price: item.price,
          quantity: item.quantity
        });
      });
    } else {
      console.log('❌ No order items found');
    }

    // Check seller wallet
    if (order.sellerId) {
      const wallet = await Wallet.findOne({ sellerId: order.sellerId });
      if (wallet) {
        console.log('\n✅ Seller wallet found');
        console.log('Wallet details:', {
          _id: wallet._id,
          sellerId: wallet.sellerId,
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          totalEarned: wallet.totalEarned
        });
      } else {
        console.log('\n❌ Seller wallet not found');
      }
    }

    // Check if order can be updated to delivered
    if (order.status !== 'delivered') {
      console.log('\n=== Testing Status Update to Delivered ===');
      
      try {
        // Simulate the status update logic
        const originalStatus = order.status;
        order.status = 'delivered';
        
        if (order.orderItems) {
          order.orderItems.forEach(item => {
            if (item && typeof item === 'object') {
              item.status = 'delivered';
            }
          });
        }
        
        console.log('✅ Status update simulation successful');
        console.log('Original status:', originalStatus);
        console.log('New status:', order.status);
        
        // Test saving
        await order.save();
        console.log('✅ Order save successful');
        
      } catch (error) {
        console.log('❌ Error during status update simulation:', error.message);
        console.log('Error details:', error);
      }
    }

    // Check for any validation errors
    try {
      await order.validate();
      console.log('\n✅ Order validation passed');
    } catch (validationError) {
      console.log('\n❌ Order validation failed:', validationError.message);
      console.log('Validation errors:', validationError.errors);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the debug script
debugOrder(); 