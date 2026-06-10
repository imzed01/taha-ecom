const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

// Define ReferralCode schema
const referralCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  isUsed: { type: Boolean, default: false },
  usedBy: {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sellerEmail: String,
    sellerStoreName: String,
    usedAt: Date,
  },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const ReferralCode = mongoose.models.ReferralCode || mongoose.model('ReferralCode', referralCodeSchema);

// Define User schema to get admin ID
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function addReferralCodes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin user ID
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Generate some test referral codes
    const testCodes = [
      '123456',
      '234567',
      '345678',
      '456789',
      '567890',
      '678901',
      '789012',
      '890123',
      '901234',
      '012345'
    ];

    console.log('Adding referral codes...\n');

    for (const code of testCodes) {
      // Check if code already exists
      const existingCode = await ReferralCode.findOne({ code });
      if (existingCode) {
        console.log(`Code ${code} already exists, skipping...`);
        continue;
      }

      // Create new referral code
      const referralCode = new ReferralCode({
        code,
        isUsed: false,
        generatedBy: adminUser._id,
      });

      await referralCode.save();
      console.log(`✅ Added referral code: ${code}`);
    }

    console.log('\n✅ All referral codes added successfully!');
    console.log('Test codes available:');
    testCodes.forEach(code => {
      console.log(`  - ${code}`);
    });

  } catch (error) {
    console.error('Error adding referral codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addReferralCodes(); 