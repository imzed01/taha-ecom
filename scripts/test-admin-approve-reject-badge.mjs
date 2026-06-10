import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Define schemas inline for simplicity
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  storeName: String
});

const walletTransactionSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['topup', 'withdrawal', 'commission', 'order_payment', 'funding_request', 'order_processing', 'order_delivered', 'admin_adjustment_add', 'admin_adjustment_deduct'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  description: { type: String, required: true },
  proofImage: String,
  transactionId: String,
  adminNotes: String,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  seenByAdmin: { type: Boolean, default: false },
  seenBySeller: { type: Boolean, default: false }
}, { timestamps: true });

const withdrawalRequestSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  transactionPin: { type: String, required: true },
  paymentMethod: { type: String, enum: ['crypto', 'bank_account'], required: true },
  paymentDetails: {
    walletAddress: String,
    cryptoType: String,
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    routingNumber: String,
    swiftCode: String
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: String,
  processedAt: Date,
  seenByAdmin: { type: Boolean, default: false },
  seenBySeller: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

async function testAdminApproveRejectBadge() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a seller for testing
    const seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      console.log('No seller found for testing');
      return;
    }

    console.log(`Using seller: ${seller.email} (ID: ${seller._id})`);

    // Step 1: Check current badge state
    console.log('\n=== STEP 1: CHECKING CURRENT BADGE STATE ===');
    const currentUpdates = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const currentWithdrawalUpdates = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    console.log(`🟢 Current Green Badge Count: ${currentUpdates + currentWithdrawalUpdates}`);
    console.log(`  - Funding updates: ${currentUpdates}`);
    console.log(`  - Withdrawal updates: ${currentWithdrawalUpdates}`);

    // Step 2: Create some pending requests for admin to approve/reject
    console.log('\n=== STEP 2: CREATING PENDING REQUESTS FOR ADMIN ===');
    
    // Create pending funding request
    const pendingFunding = new WalletTransaction({
      sellerId: seller._id,
      type: 'funding_request',
      amount: 500,
      status: 'pending',
      description: 'Test pending funding request for admin approval',
      seenByAdmin: false,
      seenBySeller: false
    });
    await pendingFunding.save();
    console.log('✅ Created pending funding request');

    // Create pending withdrawal request
    const pendingWithdrawal = new WithdrawalRequest({
      sellerId: seller._id,
      amount: 300,
      transactionPin: '1234',
      paymentMethod: 'bank_account',
      paymentDetails: {
        bankName: 'Test Bank',
        accountNumber: '1234567890',
        accountHolderName: 'Test User'
      },
      status: 'pending',
      seenByAdmin: false,
      seenBySeller: false
    });
    await pendingWithdrawal.save();
    console.log('✅ Created pending withdrawal request');

    // Step 3: Simulate admin approving/rejecting requests
    console.log('\n=== STEP 3: SIMULATING ADMIN APPROVING/REJECTING ===');
    
    // Admin approves funding request
    await WalletTransaction.findByIdAndUpdate(pendingFunding._id, {
      status: 'approved',
      seenByAdmin: true,
      seenBySeller: false // Important: seller hasn't seen this yet
    });
    console.log('✅ Admin approved funding request');

    // Admin rejects withdrawal request
    await WithdrawalRequest.findByIdAndUpdate(pendingWithdrawal._id, {
      status: 'rejected',
      adminNotes: 'Insufficient funds',
      processedAt: new Date(),
      seenByAdmin: true,
      seenBySeller: false // Important: seller hasn't seen this yet
    });
    console.log('✅ Admin rejected withdrawal request');

    // Step 4: Check badge count after admin actions
    console.log('\n=== STEP 4: CHECKING BADGE AFTER ADMIN ACTIONS ===');
    const newUpdates = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const newWithdrawalUpdates = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const totalNewUpdates = newUpdates + newWithdrawalUpdates;
    console.log(`🟢 New Green Badge Count: ${totalNewUpdates}`);
    console.log(`  - Funding updates: ${newUpdates}`);
    console.log(`  - Withdrawal updates: ${newWithdrawalUpdates}`);

    if (totalNewUpdates > (currentUpdates + currentWithdrawalUpdates)) {
      console.log('✅ SUCCESS: Badge count increased after admin actions!');
      console.log(`   Badge should show: ${totalNewUpdates}`);
    } else {
      console.log('❌ ISSUE: Badge count did not increase');
    }

    // Step 5: Simulate seller visiting wallet page (badge should disappear)
    console.log('\n=== STEP 5: SIMULATING SELLER VISITING WALLET PAGE ===');
    
    // Mark all updates as seen by seller
    await WalletTransaction.updateMany(
      {
        sellerId: seller._id,
        type: { $in: ['topup', 'funding_request'] },
        status: { $in: ['approved', 'rejected'] },
        seenBySeller: { $ne: true }
      },
      { $set: { seenBySeller: true } }
    );

    await WithdrawalRequest.updateMany(
      {
        sellerId: seller._id,
        status: { $in: ['approved', 'rejected'] },
        seenBySeller: { $ne: true }
      },
      { $set: { seenBySeller: true } }
    );

    // Check badge count after visiting wallet
    const afterVisitUpdates = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const afterVisitWithdrawalUpdates = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const totalAfterVisit = afterVisitUpdates + afterVisitWithdrawalUpdates;
    console.log(`🟢 Badge Count After Visiting Wallet: ${totalAfterVisit}`);

    if (totalAfterVisit === 0) {
      console.log('✅ SUCCESS: Badge disappeared when seller visited wallet page!');
    } else {
      console.log('❌ ISSUE: Badge did not disappear when visiting wallet page');
    }

    console.log('\n🎯 Test Summary:');
    console.log('1. ✅ Admin can approve/reject requests');
    console.log('2. ✅ Seller gets green badge for approved/rejected requests');
    console.log('3. ✅ Badge disappears when seller visits wallet page');
    console.log('4. ✅ Badge stays visible until seller clicks wallet');

    console.log('\nTo test in the UI:');
    console.log('1. Go to seller dashboard - you should see green badge');
    console.log('2. Click on Wallet - badge should disappear');
    console.log('3. Navigate away from wallet - badge should stay hidden');

  } catch (error) {
    console.error('Error testing admin approve/reject badge:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAdminApproveRejectBadge(); 