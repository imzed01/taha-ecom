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

const User = mongoose.model('User', userSchema);
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

async function createTestWalletRequests() {
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

    // Create a test funding request
    const testFundingRequest = new WalletTransaction({
      sellerId: seller._id,
      type: 'funding_request',
      amount: 100,
      status: 'pending',
      description: 'Test funding request for badge testing',
      seenByAdmin: false,
      seenBySeller: false
    });

    await testFundingRequest.save();
    console.log('✅ Test funding request created');

    // Create a test withdrawal request
    const testWithdrawalRequest = new WithdrawalRequest({
      sellerId: seller._id,
      amount: 50,
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

    await testWithdrawalRequest.save();
    console.log('✅ Test withdrawal request created');

    // Count total pending requests
    const totalFundingRequests = await WalletTransaction.countDocuments({
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending'
    });

    const totalWithdrawalRequests = await WithdrawalRequest.countDocuments({
      status: 'pending'
    });

    console.log('\n=== Current Pending Requests ===');
    console.log(`Total funding requests: ${totalFundingRequests}`);
    console.log(`Total withdrawal requests: ${totalWithdrawalRequests}`);
    console.log(`Total pending requests: ${totalFundingRequests + totalWithdrawalRequests}`);

    console.log('\n🎯 Now check the admin and seller sidebars for wallet badges!');
    console.log('The badges should show orange numbers indicating pending requests.');
    console.log('\nTo see the badges:');
    console.log('1. Go to admin dashboard - you should see an orange badge on Wallet');
    console.log('2. Go to seller dashboard - you should see an orange badge on Wallet');
    console.log('3. The badges will disappear when you navigate to the wallet page');

  } catch (error) {
    console.error('Error creating test requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestWalletRequests(); 