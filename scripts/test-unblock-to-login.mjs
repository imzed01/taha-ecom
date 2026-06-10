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

async function testUnblockToLogin() {
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

    console.log('\n📋 Test Scenario: Unblock to Login Redirect');
    console.log('==========================================');
    
    console.log(`\n🔍 Test Seller: ${testSeller.email}`);
    console.log(`   Store: ${testSeller.storeName || 'N/A'}`);
    console.log(`   Current Status: ${testSeller.isBlocked ? 'BLOCKED' : 'ACTIVE'}`);
    console.log(`   Verification: ${testSeller.verificationStatus}`);

    // Step 1: Ensure seller is verified and not blocked initially
    console.log('\n⚡ Step 1: Setting up seller as verified and active...');
    testSeller.verificationStatus = 'verified';
    testSeller.isBlocked = false;
    testSeller.blockedReason = undefined;
    await testSeller.save();
    console.log('✅ Seller setup completed');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Block the seller
    console.log('\n⚡ Step 2: Blocking seller...');
    testSeller.isBlocked = true;
    testSeller.blockedReason = 'Test blocking for login redirect verification';
    await testSeller.save();
    console.log('✅ Seller blocked successfully');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Unblock the seller
    console.log('\n⚡ Step 3: Unblocking seller...');
    testSeller.isBlocked = false;
    testSeller.blockedReason = undefined;
    await testSeller.save();
    console.log('✅ Seller unblocked successfully');

    console.log('\n📋 Expected Behavior:');
    console.log('1. Seller is blocked and on blocked page');
    console.log('2. Admin unblocks the seller');
    console.log('3. Blocked page detects unblocking within 15 seconds');
    console.log('4. Seller is redirected to: /auth/signin?role=seller&message=unblocked');
    console.log('5. Login page shows success toast: "Your account has been unblocked! You can now login."');
    console.log('6. Seller can login normally and access dashboard');

    console.log('\n🧪 Manual Test Steps:');
    console.log('1. Admin blocks the seller (seller gets logged out)');
    console.log('2. Seller logs back in and lands on blocked page');
    console.log('3. Admin unblocks the seller');
    console.log('4. Blocked page should redirect to login with success message');
    console.log('5. Seller can login and access dashboard normally');

    console.log('\n✅ Test setup completed!');
    console.log('\n🔧 Key Changes Applied:');
    console.log('- Blocked page now redirects to login (not dashboard) when unblocked');
    console.log('- Login page shows success message for unblocked sellers');
    console.log('- Session is properly refreshed before redirect');
    console.log('- No infinite redirect loops');

  } catch (error) {
    console.error('❌ Error during test setup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

testUnblockToLogin(); 