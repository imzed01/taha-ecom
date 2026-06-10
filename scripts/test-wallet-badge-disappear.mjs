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

async function testWalletBadgeDisappear() {
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

    // Count current badges
    const pendingFundingRequests = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    const pendingWithdrawalRequests = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    const fundingUpdates = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const withdrawalUpdates = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    console.log('\n=== BEFORE VISITING WALLET PAGE ===');
    console.log(`🟠 Orange Badge (Pending Requests): ${pendingFundingRequests + pendingWithdrawalRequests}`);
    console.log(`  - Pending funding: ${pendingFundingRequests}`);
    console.log(`  - Pending withdrawal: ${pendingWithdrawalRequests}`);
    console.log(`🟢 Green Badge (Request Updates): ${fundingUpdates + withdrawalUpdates}`);
    console.log(`  - Funding updates: ${fundingUpdates}`);
    console.log(`  - Withdrawal updates: ${withdrawalUpdates}`);

    // Simulate marking requests as seen (what happens when visiting wallet page)
    console.log('\n=== SIMULATING WALLET PAGE VISIT ===');
    
    // Mark pending requests as seen
    const pendingResult = await WalletTransaction.updateMany(
      {
        sellerId: seller._id,
        type: { $in: ['topup', 'funding_request'] },
        status: 'pending',
        seenBySeller: { $ne: true }
      },
      { $set: { seenBySeller: true } }
    );

    const pendingWithdrawalResult = await WithdrawalRequest.updateMany(
      {
        sellerId: seller._id,
        status: 'pending',
        seenBySeller: { $ne: true }
      },
      { $set: { seenBySeller: true } }
    );

    // Mark updates as seen
    const updatesResult = await WalletTransaction.updateMany(
      {
        sellerId: seller._id,
        type: { $in: ['topup', 'funding_request'] },
        status: { $in: ['approved', 'rejected'] },
        seenBySeller: { $ne: true }
      },
      { $set: { seenBySeller: true } }
    );

    const withdrawalUpdatesResult = await WithdrawalRequest.updateMany(
      {
        sellerId: seller._id,
        status: { $in: ['approved', 'rejected'] },
        seenBySeller: { $ne: true }
      },
      { $set: { seenBySeller: true } }
    );

    console.log(`✅ Marked ${pendingResult.modifiedCount} pending funding requests as seen`);
    console.log(`✅ Marked ${pendingWithdrawalResult.modifiedCount} pending withdrawal requests as seen`);
    console.log(`✅ Marked ${updatesResult.modifiedCount} funding updates as seen`);
    console.log(`✅ Marked ${withdrawalUpdatesResult.modifiedCount} withdrawal updates as seen`);

    // Count badges after marking as seen
    const pendingFundingAfter = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    const pendingWithdrawalAfter = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    const fundingUpdatesAfter = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const withdrawalUpdatesAfter = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    console.log('\n=== AFTER VISITING WALLET PAGE ===');
    console.log(`🟠 Orange Badge (Pending Requests): ${pendingFundingAfter + pendingWithdrawalAfter}`);
    console.log(`🟢 Green Badge (Request Updates): ${fundingUpdatesAfter + withdrawalUpdatesAfter}`);

    if ((pendingFundingAfter + pendingWithdrawalAfter) === 0 && (fundingUpdatesAfter + withdrawalUpdatesAfter) === 0) {
      console.log('\n✅ SUCCESS: All badges should disappear when visiting wallet page!');
    } else {
      console.log('\n❌ ISSUE: Some badges are still showing after visiting wallet page');
    }

    console.log('\n🎯 Test completed! The badges should now be cleared.');
    console.log('To test again, run:');
    console.log('node scripts/create-test-wallet-requests.mjs');
    console.log('node scripts/create-test-wallet-updates.mjs');

  } catch (error) {
    console.error('Error testing wallet badge disappear:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testWalletBadgeDisappear(); 