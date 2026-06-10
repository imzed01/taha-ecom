const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');

async function createTestWalletRequests() {
  try {
    // Connect to MongoDB
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
      description: 'Test funding request for badge debugging'
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
      status: 'pending'
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

  } catch (error) {
    console.error('Error creating test requests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestWalletRequests(); 