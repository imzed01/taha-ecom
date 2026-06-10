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

async function unblockSeller() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a blocked seller
    const seller = await User.findOne({ role: 'seller', isBlocked: true });
    if (!seller) {
      console.log('No blocked seller found');
      return;
    }

    console.log('Unblocking seller:', {
      id: seller._id,
      email: seller.email,
      storeName: seller.storeName
    });

    // Unblock the seller
    seller.isBlocked = false;
    seller.blockedReason = undefined;
    await seller.save();

    console.log('✅ Seller unblocked successfully!');
    console.log('\n📋 The seller can now access their dashboard normally');

  } catch (error) {
    console.error('Error unblocking seller:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

unblockSeller(); 