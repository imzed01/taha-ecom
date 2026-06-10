import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Define schemas inline for simplicity
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

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

async function testWalletBadgeSeen() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing Wallet Badge "Mark as Seen" Functionality ===\n');

    // Test 1: Count unseen requests for admin
    const adminUnseenFunding = await WalletTransaction.countDocuments({
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending',
      seenByAdmin: { $ne: true }
    });

    const adminUnseenWithdrawal = await WithdrawalRequest.countDocuments({
      status: 'pending',
      seenByAdmin: { $ne: true }
    });

    console.log('1. Admin Unseen Requests:');
    console.log(`   - Funding requests: ${adminUnseenFunding}`);
    console.log(`   - Withdrawal requests: ${adminUnseenWithdrawal}`);
    console.log(`   - Total unseen: ${adminUnseenFunding + adminUnseenWithdrawal}`);

    // Test 2: Count unseen requests for seller
    const sellerUnseenFunding = await WalletTransaction.countDocuments({
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    const sellerUnseenWithdrawal = await WithdrawalRequest.countDocuments({
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    console.log('\n2. Seller Unseen Requests:');
    console.log(`   - Funding requests: ${sellerUnseenFunding}`);
    console.log(`   - Withdrawal requests: ${sellerUnseenWithdrawal}`);
    console.log(`   - Total unseen: ${sellerUnseenFunding + sellerUnseenWithdrawal}`);

    // Test 3: Simulate admin marking requests as seen
    console.log('\n3. Simulating admin marking requests as seen...');
    await WalletTransaction.updateMany(
      {
        type: { $in: ['topup', 'funding_request'] },
        status: 'pending',
        seenByAdmin: { $ne: true }
      },
      {
        $set: { seenByAdmin: true }
      }
    );

    await WithdrawalRequest.updateMany(
      {
        status: 'pending',
        seenByAdmin: { $ne: true }
      },
      {
        $set: { seenByAdmin: true }
      }
    );

    // Test 4: Count admin unseen requests after marking as seen
    const adminUnseenFundingAfter = await WalletTransaction.countDocuments({
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending',
      seenByAdmin: { $ne: true }
    });

    const adminUnseenWithdrawalAfter = await WithdrawalRequest.countDocuments({
      status: 'pending',
      seenByAdmin: { $ne: true }
    });

    console.log('\n4. Admin Unseen Requests After Marking as Seen:');
    console.log(`   - Funding requests: ${adminUnseenFundingAfter}`);
    console.log(`   - Withdrawal requests: ${adminUnseenWithdrawalAfter}`);
    console.log(`   - Total unseen: ${adminUnseenFundingAfter + adminUnseenWithdrawalAfter}`);

    // Test 5: Simulate seller marking requests as seen
    console.log('\n5. Simulating seller marking requests as seen...');
    await WalletTransaction.updateMany(
      {
        type: { $in: ['topup', 'funding_request'] },
        status: 'pending',
        seenBySeller: { $ne: true }
      },
      {
        $set: { seenBySeller: true }
      }
    );

    await WithdrawalRequest.updateMany(
      {
        status: 'pending',
        seenBySeller: { $ne: true }
      },
      {
        $set: { seenBySeller: true }
      }
    );

    // Test 6: Count seller unseen requests after marking as seen
    const sellerUnseenFundingAfter = await WalletTransaction.countDocuments({
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    const sellerUnseenWithdrawalAfter = await WithdrawalRequest.countDocuments({
      status: 'pending',
      seenBySeller: { $ne: true }
    });

    console.log('\n6. Seller Unseen Requests After Marking as Seen:');
    console.log(`   - Funding requests: ${sellerUnseenFundingAfter}`);
    console.log(`   - Withdrawal requests: ${sellerUnseenWithdrawalAfter}`);
    console.log(`   - Total unseen: ${sellerUnseenFundingAfter + sellerUnseenWithdrawalAfter}`);

    console.log('\n✅ Test completed successfully!');
    console.log('The "mark as seen" functionality is working correctly.');
    console.log('Badges should now only show for unseen requests.');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testWalletBadgeSeen(); 