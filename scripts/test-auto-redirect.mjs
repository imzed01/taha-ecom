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

async function testAutoRedirect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a seller to test with
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      console.log('No seller found, creating test seller...');
      seller = new User({
        email: 'test-seller@example.com',
        role: 'seller',
        storeName: 'Test Store',
        verificationStatus: 'pending',
        isBlocked: false,
      });
      await seller.save();
      console.log('Created test seller:', seller.email);
    }

    console.log('\n🧪 Testing Auto-Redirect Functionality');
    console.log('=====================================');

    // Test 1: Seller is pending, then gets verified
    console.log('\n1️⃣ Test: Pending → Verified');
    seller.verificationStatus = 'pending';
    seller.isBlocked = false;
    await seller.save();
    console.log('✅ Set seller to pending status');
    console.log('📝 Expected: Seller on /seller/pending should auto-redirect to /seller/dashboard when verified');
    
    // Simulate admin verification after 5 seconds
    setTimeout(async () => {
      seller.verificationStatus = 'verified';
      await seller.save();
      console.log('✅ Admin verified the seller - auto-redirect should trigger');
    }, 5000);

    // Test 2: Seller is verified, then gets blocked
    setTimeout(async () => {
      console.log('\n2️⃣ Test: Verified → Blocked');
      seller.verificationStatus = 'verified';
      seller.isBlocked = true;
      seller.blockedReason = 'Test blocking for auto-redirect';
      await seller.save();
      console.log('✅ Set seller to blocked status');
      console.log('📝 Expected: Seller on dashboard should auto-redirect to /seller/blocked');
    }, 10000);

    // Test 3: Seller is blocked, then gets unblocked
    setTimeout(async () => {
      console.log('\n3️⃣ Test: Blocked → Unblocked');
      seller.isBlocked = false;
      seller.blockedReason = undefined;
      await seller.save();
      console.log('✅ Admin unblocked the seller - auto-redirect should trigger');
      console.log('📝 Expected: Seller on /seller/blocked should auto-redirect to /seller/dashboard');
    }, 15000);

    // Test 4: Seller is rejected, then gets verified
    setTimeout(async () => {
      console.log('\n4️⃣ Test: Rejected → Verified');
      seller.verificationStatus = 'rejected';
      seller.isBlocked = false;
      await seller.save();
      console.log('✅ Set seller to rejected status');
      
      setTimeout(async () => {
        seller.verificationStatus = 'verified';
        await seller.save();
        console.log('✅ Admin verified the rejected seller - auto-redirect should trigger');
        console.log('📝 Expected: Seller on /seller/rejected should auto-redirect to /seller/dashboard');
      }, 5000);
    }, 20000);

    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Start the Next.js app: npm run dev');
    console.log('2. Sign in as the test seller:');
    console.log(`   Email: ${seller.email}`);
    console.log('   Role: seller');
    console.log('3. Watch the console logs and page redirects as status changes');
    console.log('4. Test the "Check Status" buttons manually');
    console.log('5. Test the chat support button on blocked page');

    console.log('\n⏰ Auto-redirect timings:');
    console.log('- Pending page: checks every 10 seconds');
    console.log('- Rejected page: checks every 10 seconds');
    console.log('- Blocked page: checks every 15 seconds');

    // Clean up after 30 seconds
    setTimeout(async () => {
      console.log('\n🧹 Cleaning up test data...');
      await User.deleteOne({ _id: seller._id });
      console.log('✅ Test seller deleted');
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
      process.exit(0);
    }, 30000);

  } catch (error) {
    console.error('Error in test:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testAutoRedirect(); 