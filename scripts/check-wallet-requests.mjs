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

async function checkWalletRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check funding requests
    const fundingRequests = await WalletTransaction.find({
      type: { $in: ['topup', 'funding_request'] },
      status: 'pending'
    });

    console.log('\n=== Funding Requests ===');
    console.log(`Total pending funding requests: ${fundingRequests.length}`);
    fundingRequests.forEach(req => {
      console.log(`- ID: ${req._id}, Seller: ${req.sellerId}, Amount: $${req.amount}, Type: ${req.type}, Seen by Admin: ${req.seenByAdmin}, Seen by Seller: ${req.seenBySeller}`);
    });

    // Check withdrawal requests
    const withdrawalRequests = await WithdrawalRequest.find({
      status: 'pending'
    });

    console.log('\n=== Withdrawal Requests ===');
    console.log(`Total pending withdrawal requests: ${withdrawalRequests.length}`);
    withdrawalRequests.forEach(req => {
      console.log(`- ID: ${req._id}, Seller: ${req.sellerId}, Amount: $${req.amount}, Method: ${req.paymentMethod}, Seen by Admin: ${req.seenByAdmin}, Seen by Seller: ${req.seenBySeller}`);
    });

    const totalPending = fundingRequests.length + withdrawalRequests.length;
    console.log(`\n=== Summary ===`);
    console.log(`Total pending wallet requests: ${totalPending}`);

    if (totalPending === 0) {
      console.log('\n❌ No pending wallet requests found!');
      console.log('This is why you\'re not seeing badges.');
      console.log('Try creating some test requests through the application.');
    } else {
      console.log('\n✅ Pending requests found!');
      console.log('If you\'re not seeing badges, there might be an issue with the badge logic.');
    }

  } catch (error) {
    console.error('Error checking wallet requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkWalletRequests(); 