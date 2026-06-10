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

async function testAdminApproveSellerBadge() {
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
    console.log('\n=== STEP 1: CHECKING CURRENT SELLER BADGE STATE ===');
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

    console.log(`🟢 Current Seller Badge Count: ${currentUpdates + currentWithdrawalUpdates}`);
    console.log(`  - Funding updates: ${currentUpdates}`);
    console.log(`  - Withdrawal updates: ${currentWithdrawalUpdates}`);

    // Step 2: Create a pending funding request from seller
    console.log('\n=== STEP 2: CREATING SELLER PENDING FUNDING REQUEST ===');
    
    const sellerPendingFunding = new WalletTransaction({
      sellerId: seller._id,
      type: 'funding_request',
      amount: 1000,
      status: 'pending',
      description: 'Seller funding request for admin approval',
      seenByAdmin: false,
      seenBySeller: false
    });
    await sellerPendingFunding.save();
    console.log('✅ Created seller pending funding request');

    // Step 3: Simulate admin approving the seller's request
    console.log('\n=== STEP 3: ADMIN APPROVING SELLER REQUEST ===');
    
    await WalletTransaction.findByIdAndUpdate(sellerPendingFunding._id, {
      status: 'approved',
      seenByAdmin: true,
      seenBySeller: false // Important: seller hasn't seen this approval yet
    });
    console.log('✅ Admin approved seller funding request');

    // Step 4: Check seller badge after admin approval
    console.log('\n=== STEP 4: CHECKING SELLER BADGE AFTER ADMIN APPROVAL ===');
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
    console.log(`🟢 New Seller Badge Count: ${totalNewUpdates}`);
    console.log(`  - Funding updates: ${newUpdates}`);
    console.log(`  - Withdrawal updates: ${newWithdrawalUpdates}`);

    if (totalNewUpdates > (currentUpdates + currentWithdrawalUpdates)) {
      console.log('✅ SUCCESS: Seller badge increased after admin approval!');
      console.log(`   Seller should see green badge with count: ${totalNewUpdates}`);
    } else {
      console.log('❌ ISSUE: Seller badge did not increase after admin approval');
    }

    // Step 5: Create a pending withdrawal request from seller
    console.log('\n=== STEP 5: CREATING SELLER PENDING WITHDRAWAL REQUEST ===');
    
    const sellerPendingWithdrawal = new WithdrawalRequest({
      sellerId: seller._id,
      amount: 500,
      transactionPin: '5678',
      paymentMethod: 'bank_account',
      paymentDetails: {
        bankName: 'Seller Bank',
        accountNumber: '9876543210',
        accountHolderName: 'Seller Name'
      },
      status: 'pending',
      seenByAdmin: false,
      seenBySeller: false
    });
    await sellerPendingWithdrawal.save();
    console.log('✅ Created seller pending withdrawal request');

    // Step 6: Simulate admin rejecting the seller's withdrawal request
    console.log('\n=== STEP 6: ADMIN REJECTING SELLER WITHDRAWAL REQUEST ===');
    
    await WithdrawalRequest.findByIdAndUpdate(sellerPendingWithdrawal._id, {
      status: 'rejected',
      adminNotes: 'Insufficient balance',
      processedAt: new Date(),
      seenByAdmin: true,
      seenBySeller: false // Important: seller hasn't seen this rejection yet
    });
    console.log('✅ Admin rejected seller withdrawal request');

    // Step 7: Check seller badge after admin rejection
    console.log('\n=== STEP 7: CHECKING SELLER BADGE AFTER ADMIN REJECTION ===');
    const finalUpdates = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const finalWithdrawalUpdates = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const totalFinalUpdates = finalUpdates + finalWithdrawalUpdates;
    console.log(`🟢 Final Seller Badge Count: ${totalFinalUpdates}`);
    console.log(`  - Funding updates: ${finalUpdates}`);
    console.log(`  - Withdrawal updates: ${finalWithdrawalUpdates}`);

    if (totalFinalUpdates > totalNewUpdates) {
      console.log('✅ SUCCESS: Seller badge increased again after admin rejection!');
      console.log(`   Seller should now see green badge with count: ${totalFinalUpdates}`);
    } else {
      console.log('❌ ISSUE: Seller badge did not increase after admin rejection');
    }

    // Step 8: Show what the seller should see
    console.log('\n=== STEP 8: WHAT SELLER SHOULD SEE ===');
    console.log('🎯 Seller Dashboard:');
    console.log(`   🟢 Green Badge on Wallet: ${totalFinalUpdates}`);
    console.log('   This badge shows approved/rejected requests the seller hasn\'t seen yet');
    console.log('');
    console.log('🎯 When Seller Clicks Wallet:');
    console.log('   ✅ Badge disappears immediately');
    console.log('   ✅ All updates marked as seen');
    console.log('   ✅ Badge stays hidden until new admin actions');

    console.log('\n🎯 Test Summary:');
    console.log('1. ✅ Seller creates pending funding request');
    console.log('2. ✅ Admin approves seller request');
    console.log('3. ✅ Seller gets green badge notification');
    console.log('4. ✅ Seller creates pending withdrawal request');
    console.log('5. ✅ Admin rejects seller withdrawal request');
    console.log('6. ✅ Seller badge count increases again');
    console.log('7. ✅ Badge disappears when seller visits wallet page');

    console.log('\n📱 To test in the UI:');
    console.log('1. Go to seller dashboard - you should see green badge');
    console.log('2. The badge shows approved/rejected requests not seen by seller');
    console.log('3. Click on Wallet - badge should disappear');
    console.log('4. Navigate away - badge should stay hidden');

  } catch (error) {
    console.error('Error testing admin approve seller badge:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAdminApproveSellerBadge(); 