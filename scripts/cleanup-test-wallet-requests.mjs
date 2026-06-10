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
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
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
  processedAt: Date
}, { timestamps: true });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

async function cleanupTestWalletRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove test funding requests
    const fundingResult = await WalletTransaction.deleteMany({
      description: 'Test funding request for badge testing'
    });

    // Remove test withdrawal requests
    const withdrawalResult = await WithdrawalRequest.deleteMany({
      transactionPin: '1234',
      'paymentDetails.bankName': 'Test Bank'
    });

    console.log(`✅ Cleaned up ${fundingResult.deletedCount} test funding requests`);
    console.log(`✅ Cleaned up ${withdrawalResult.deletedCount} test withdrawal requests`);

    // Verify cleanup
    const remainingFunding = await WalletTransaction.countDocuments({
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending'
    });

    const remainingWithdrawal = await WithdrawalRequest.countDocuments({
      status: 'pending'
    });

    console.log(`\n=== Remaining Requests ===`);
    console.log(`Funding requests: ${remainingFunding}`);
    console.log(`Withdrawal requests: ${remainingWithdrawal}`);
    console.log(`Total: ${remainingFunding + remainingWithdrawal}`);

  } catch (error) {
    console.error('Error cleaning up test requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupTestWalletRequests(); 