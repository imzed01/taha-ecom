import mongoose from 'mongoose';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

// Define User schema
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  verificationStatus: String,
  isBlocked: { type: Boolean, default: false },
  blockedReason: String,
  storeName: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function testPageRefreshRedirect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create a test seller
    let seller = await User.findOne({ email: 'test-refresh-seller@example.com' });
    if (!seller) {
      seller = new User({
        email: 'test-refresh-seller@example.com',
        role: 'seller',
        storeName: 'Test Refresh Store',
        verificationStatus: 'verified',
        isBlocked: true,
        blockedReason: 'Testing page refresh redirect',
      });
      await seller.save();
      console.log('Created test seller for page refresh testing');
    }

    console.log('\n🧪 Testing Page Refresh Redirect Functionality');
    console.log('==============================================');
    
    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Start the Next.js app: npm run dev');
    console.log('2. Sign in as the test seller:');
    console.log(`   Email: ${seller.email}`);
    console.log('   Role: seller');
    console.log('3. You should be redirected to /seller/blocked page');
    
    console.log('\n🔄 Test Scenario 1: Blocked → Unblocked');
    console.log('Current status: BLOCKED');
    console.log('1. Stay on http://localhost:3000/seller/blocked');
    console.log('2. Wait 5 seconds for admin to unblock...');
    
    // Unblock the seller after 5 seconds
    setTimeout(async () => {
      seller.isBlocked = false;
      seller.blockedReason = undefined;
      await seller.save();
      console.log('✅ Admin unblocked the seller');
      console.log('3. Now REFRESH the page (F5 or Ctrl+R)');
      console.log('4. You should be immediately redirected to /seller/dashboard');
      console.log('   (No need to wait for auto-check interval)');
    }, 5000);

    console.log('\n🔄 Test Scenario 2: Verified → Blocked');
    setTimeout(async () => {
      console.log('\n--- New Test Scenario ---');
      seller.isBlocked = true;
      seller.blockedReason = 'Testing refresh redirect again';
      await seller.save();
      console.log('✅ Admin blocked the seller again');
      console.log('1. If you\'re on dashboard, refresh the page');
      console.log('2. You should be redirected to /seller/blocked');
    }, 15000);

    console.log('\n🔄 Test Scenario 3: Blocked → Pending');
    setTimeout(async () => {
      console.log('\n--- New Test Scenario ---');
      seller.isBlocked = false;
      seller.verificationStatus = 'pending';
      await seller.save();
      console.log('✅ Admin unblocked and set to pending');
      console.log('1. Refresh the blocked page');
      console.log('2. You should be redirected to /seller/pending');
    }, 25000);

    console.log('\n📝 Expected Behavior:');
    console.log('- Page refresh should immediately check status');
    console.log('- No waiting for auto-check intervals');
    console.log('- Instant redirect to appropriate page');
    console.log('- No toast notifications on page load (silent redirect)');
    
    console.log('\n⚠️  Important Notes:');
    console.log('- The redirect happens IMMEDIATELY on page load');
    console.log('- This is different from the auto-check intervals');
    console.log('- Works for all status pages: /seller/pending, /seller/blocked, /seller/rejected');

    // Clean up after 35 seconds
    setTimeout(async () => {
      console.log('\n🧹 Cleaning up test data...');
      await User.deleteOne({ _id: seller._id });
      console.log('✅ Test seller deleted');
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
      process.exit(0);
    }, 35000);

  } catch (error) {
    console.error('Error in test:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testPageRefreshRedirect(); 