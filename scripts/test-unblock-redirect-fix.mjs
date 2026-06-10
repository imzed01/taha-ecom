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

async function testUnblockRedirectFix() {
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

    console.log('\n📋 Test Scenario: Unblock Redirect Fix');
    console.log('=====================================');
    
    console.log(`\n🔍 Test Seller: ${testSeller.email}`);
    console.log(`   Store: ${testSeller.storeName || 'N/A'}`);
    console.log(`   Current Status: ${testSeller.isBlocked ? 'BLOCKED' : 'ACTIVE'}`);
    console.log(`   Verification: ${testSeller.verificationStatus}`);

    // Step 1: Block the seller
    console.log('\n⚡ Step 1: Blocking seller...');
    testSeller.isBlocked = true;
    testSeller.blockedReason = 'Test blocking for redirect fix verification';
    await testSeller.save();
    console.log('✅ Seller blocked successfully');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Unblock the seller
    console.log('\n⚡ Step 2: Unblocking seller...');
    testSeller.isBlocked = false;
    testSeller.blockedReason = undefined;
    await testSeller.save();
    console.log('✅ Seller unblocked successfully');

    console.log('\n📋 Expected Behavior:');
    console.log('1. If seller is on blocked page when unblocked');
    console.log('2. Page should detect unblocking via API status check');
    console.log('3. Session should be refreshed with fresh JWT token');
    console.log('4. Seller should be redirected to login page (not dashboard)');
    console.log('5. Login page shows success message');
    console.log('6. No infinite redirect loop should occur');

    console.log('\n🧪 Test Instructions:');
    console.log('1. Login as the test seller');
    console.log('2. Admin should block the seller (seller gets logged out)');
    console.log('3. Seller logs back in and lands on blocked page');
    console.log('4. Admin unblocks the seller');
    console.log('5. Within 15 seconds, blocked page should redirect to login page');
    console.log('6. Login page should show success message');
    console.log('7. Seller can login and access dashboard normally');

    console.log('\n✅ Test setup completed!');
    console.log('\n🔧 Key Fixes Applied:');
    console.log('- JWT token now includes isBlocked and blockedReason');
    console.log('- Session refresh forces fresh data fetch from database');
    console.log('- DashboardLayout prevents redirect loops');
    console.log('- Blocked page redirects to login (not dashboard) when unblocked');
    console.log('- Login page shows success message for unblocked sellers');

  } catch (error) {
    console.error('❌ Error during test setup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

testUnblockRedirectFix(); 