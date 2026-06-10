import mongoose from 'mongoose';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

async function clearRejectionReasons() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define User schema
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'seller'], required: true },
      storeName: String,
      idImageFront: String,
      idImageBack: String,
      verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      rejectionReason: String,
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // Find all sellers with rejection reasons
    const sellersWithReasons = await User.find({ 
      role: 'seller', 
      rejectionReason: { $exists: true, $ne: null } 
    });

    console.log(`Found ${sellersWithReasons.length} sellers with rejection reasons:`);
    
    for (const seller of sellersWithReasons) {
      console.log(`- ${seller.storeName} (${seller.email}): "${seller.rejectionReason}"`);
    }

    if (sellersWithReasons.length > 0) {
      // Clear all rejection reasons
      const result = await User.updateMany(
        { role: 'seller', rejectionReason: { $exists: true } },
        { $unset: { rejectionReason: "" } }
      );
      
      console.log(`\nCleared rejection reasons for ${result.modifiedCount} sellers`);
      
      // Reset verification status to pending for rejected sellers
      const resetResult = await User.updateMany(
        { role: 'seller', verificationStatus: 'rejected' },
        { verificationStatus: 'pending' }
      );
      
      console.log(`Reset ${resetResult.modifiedCount} rejected sellers to pending status`);
    } else {
      console.log('No sellers with rejection reasons found');
    }

    console.log('\nOperation completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

clearRejectionReasons(); 