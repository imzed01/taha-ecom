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

async function cleanupTestWalletUpdates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove test approved/rejected funding requests
    const fundingResult = await WalletTransaction.deleteMany({
      description: { $regex: /Test.*funding request.*badge testing/ },
      status: { $in: ['approved', 'rejected'] }
    });

    // Remove test approved/rejected withdrawal requests
    const withdrawalResult = await WithdrawalRequest.deleteMany({
      transactionPin: { $in: ['5678', '9999'] },
      status: { $in: ['approved', 'rejected'] }
    });

    console.log(`✅ Cleaned up ${fundingResult.deletedCount} test funding request updates`);
    console.log(`✅ Cleaned up ${withdrawalResult.deletedCount} test withdrawal request updates`);

    // Verify cleanup
    const remainingFundingUpdates = await WalletTransaction.countDocuments({
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    const remainingWithdrawalUpdates = await WithdrawalRequest.countDocuments({
      status: { $in: ['approved', 'rejected'] },
      seenBySeller: { $ne: true }
    });

    console.log(`\n=== Remaining Updates ===`);
    console.log(`Funding updates: ${remainingFundingUpdates}`);
    console.log(`Withdrawal updates: ${remainingWithdrawalUpdates}`);
    console.log(`Total: ${remainingFundingUpdates + remainingWithdrawalUpdates}`);

  } catch (error) {
    console.error('Error cleaning up test wallet updates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupTestWalletUpdates(); 