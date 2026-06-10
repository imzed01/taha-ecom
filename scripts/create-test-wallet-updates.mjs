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

async function createTestWalletUpdates() {
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

    // Create a test approved funding request
    const testApprovedFunding = new WalletTransaction({
      sellerId: seller._id,
      type: 'funding_request',
      amount: 200,
      status: 'approved',
      description: 'Test approved funding request for badge testing',
      seenByAdmin: true,
      seenBySeller: false // Not seen by seller yet
    });

    await testApprovedFunding.save();
    console.log('✅ Test approved funding request created');

    // Create a test rejected funding request
    const testRejectedFunding = new WalletTransaction({
      sellerId: seller._id,
      type: 'funding_request',
      amount: 150,
      status: 'rejected',
      description: 'Test rejected funding request for badge testing',
      adminNotes: 'Insufficient documentation provided',
      seenByAdmin: true,
      seenBySeller: false // Not seen by seller yet
    });

    await testRejectedFunding.save();
    console.log('✅ Test rejected funding request created');

    // Create a test approved withdrawal request
    const testApprovedWithdrawal = new WithdrawalRequest({
      sellerId: seller._id,
      amount: 75,
      transactionPin: '5678',
      paymentMethod: 'bank_account',
      paymentDetails: {
        bankName: 'Test Bank Approved',
        accountNumber: '9876543210',
        accountHolderName: 'Test User Approved'
      },
      status: 'approved',
      processedAt: new Date(),
      seenByAdmin: true,
      seenBySeller: false // Not seen by seller yet
    });

    await testApprovedWithdrawal.save();
    console.log('✅ Test approved withdrawal request created');

    // Create a test rejected withdrawal request
    const testRejectedWithdrawal = new WithdrawalRequest({
      sellerId: seller._id,
      amount: 100,
      transactionPin: '9999',
      paymentMethod: 'crypto',
      paymentDetails: {
        walletAddress: '0x1234567890abcdef',
        cryptoType: 'ETH'
      },
      status: 'rejected',
      adminNotes: 'Invalid wallet address format',
      processedAt: new Date(),
      seenByAdmin: true,
      seenBySeller: false // Not seen by seller yet
    });

    await testRejectedWithdrawal.save();
    console.log('✅ Test rejected withdrawal request created');

    // Count total wallet request updates
    const totalFundingUpdates = await WalletTransaction.countDocuments({
      sellerId: seller._id,
      type: { $in: ['topup', 'funding_request'] },
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const totalWithdrawalUpdates = await WithdrawalRequest.countDocuments({
      sellerId: seller._id,
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    console.log('\n=== Current Wallet Request Updates ===');
    console.log(`Total funding updates: ${totalFundingUpdates}`);
    console.log(`Total withdrawal updates: ${totalWithdrawalUpdates}`);
    console.log(`Total updates: ${totalFundingUpdates + totalWithdrawalUpdates}`);

    console.log('\n🎯 Now check the seller sidebar for wallet update badges!');
    console.log('The seller should see a green badge on Wallet showing the number of updates.');
    console.log('\nTo see the badges:');
    console.log('1. Go to seller dashboard - you should see a green badge on Wallet');
    console.log('2. The green badge shows approved/rejected requests the seller hasn\'t seen yet');
    console.log('3. The badge will disappear when the seller visits the wallet page');

  } catch (error) {
    console.error('Error creating test wallet updates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestWalletUpdates(); 