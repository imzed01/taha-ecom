#!/usr/bin/env node

import mongoose from 'mongoose';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

// Define User schema
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  isBlocked: { type: Boolean, default: false },
  blockedReason: String,
  storeName: String,
  verificationStatus: { type: String, default: 'pending' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function testVerifiedToLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a seller to test with (or create one)
    let testSeller = await User.findOne({ 
      role: 'seller', 
      email: { $ne: 'admin@taha.com' } 
    });

    if (!testSeller) {
      console.log('❌ No test seller found. Please create one first.');
      return;
    }

    console.log('\n📋 Test Scenario: Verified to Login Redirect');
    console.log('==========================================');
    
    console.log(`\n🔍 Test Seller: ${testSeller.email}`);
    console.log(`   Store: ${testSeller.storeName || 'N/A'}`);
    console.log(`   Current Status: ${testSeller.isBlocked ? 'BLOCKED' : 'ACTIVE'}`);
    console.log(`   Verification: ${testSeller.verificationStatus}`);

    // Step 1: Set seller as pending verification
    console.log('\n⚡ Step 1: Setting seller as pending verification...');
    testSeller.verificationStatus = 'pending';
    testSeller.isBlocked = false;
    testSeller.blockedReason = undefined;
    await testSeller.save();
    console.log('✅ Seller set to pending verification');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Verify the seller
    console.log('\n⚡ Step 2: Verifying seller...');
    testSeller.verificationStatus = 'verified';
    await testSeller.save();
    console.log('✅ Seller verified successfully');

    console.log('\n📋 Expected Behavior:');
    console.log('1. Seller is on pending page waiting for verification');
    console.log('2. Admin verifies the seller');
    console.log('3. Pending page detects verification within 10 seconds');
    console.log('4. Seller is redirected to: /auth/signin?role=seller&message=verified');
    console.log('5. Login page shows success toast: "Your account has been verified! You can now login."');
    console.log('6. Seller can login normally and access dashboard');

    console.log('\n🧪 Manual Test Steps:');
    console.log('1. Create a new seller account (gets pending status)');
    console.log('2. Seller logs in and lands on pending page');
    console.log('3. Admin verifies the seller from admin panel');
    console.log('4. Pending page should redirect to login with success message');
    console.log('5. Seller can login and access dashboard normally');

    console.log('\n✅ Test setup completed!');
    console.log('\n🔧 Key Changes Applied:');
    console.log('- Pending page now redirects to login (not dashboard) when verified');
    console.log('- Login page shows success message for verified sellers');
    console.log('- Session is properly refreshed before redirect');
    console.log('- Consistent behavior with unblocked sellers');

  } catch (error) {
    console.error('❌ Error during test setup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

testVerifiedToLogin(); 