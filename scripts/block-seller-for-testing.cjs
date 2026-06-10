const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

// Define User schema
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  isBlocked: { type: Boolean, default: false },
  blockedReason: String,
  storeName: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function blockSellerForTesting() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a seller to block
    const seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      console.log('No seller found to block');
      return;
    }

    console.log('Blocking seller:', {
      id: seller._id,
      email: seller.email,
      storeName: seller.storeName
    });

    // Block the seller
    seller.isBlocked = true;
    seller.blockedReason = 'Account blocked for testing purposes';
    await seller.save();

    console.log('✅ Seller blocked successfully!');
    console.log('\n📋 Test Steps:');
    console.log('1. Go to http://localhost:3001/auth/signin');
    console.log('2. Login with seller credentials:');
    console.log(`   Email: ${seller.email}`);
    console.log('   Role: seller');
    console.log('3. You should be redirected to /seller/blocked');
    console.log('4. The blocked page should show the reason and prevent dashboard access');

  } catch (error) {
    console.error('Error blocking seller:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

blockSellerForTesting(); 