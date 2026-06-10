const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

// Define User schema
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  isBlocked: { type: Boolean, default: false },
  blockedReason: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function testBlockUnblock() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a seller to test with
    const seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      console.log('No seller found to test with');
      return;
    }

    console.log('Testing with seller:', {
      id: seller._id,
      email: seller.email,
      currentIsBlocked: seller.isBlocked
    });

    // Test blocking
    console.log('\n--- Testing Block ---');
    seller.isBlocked = true;
    seller.blockedReason = 'Test blocking reason';
    await seller.save();
    console.log('Seller blocked successfully');

    // Verify blocking
    const blockedSeller = await User.findById(seller._id);
    console.log('After blocking:', {
      isBlocked: blockedSeller.isBlocked,
      blockedReason: blockedSeller.blockedReason
    });

    // Test unblocking
    console.log('\n--- Testing Unblock ---');
    seller.isBlocked = false;
    seller.blockedReason = undefined;
    await seller.save();
    console.log('Seller unblocked successfully');

    // Verify unblocking
    const unblockedSeller = await User.findById(seller._id);
    console.log('After unblocking:', {
      isBlocked: unblockedSeller.isBlocked,
      blockedReason: unblockedSeller.blockedReason
    });

    console.log('\n✅ Block/Unblock test completed successfully!');

  } catch (error) {
    console.error('Error testing block/unblock:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testBlockUnblock(); 