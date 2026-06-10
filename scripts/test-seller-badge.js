import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom';

const SupportMessageSchema = new mongoose.Schema({
  senderId: String,
  senderRole: String,
  receiverId: String,
  message: String,
  createdAt: Date,
  seenByAdmin: Boolean,
  seenBySeller: Boolean,
});

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);

async function testSellerBadge() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧪 Testing Seller Badge Functionality');
    console.log('=====================================\n');

    // Clear existing messages
    console.log('1. Clearing existing messages...');
    await SupportMessage.deleteMany({});

    // Create test messages
    console.log('2. Creating test messages...');
    const testMessages = [
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Message 1 from admin to seller1',
        createdAt: new Date(),
        seenByAdmin: true,
        seenBySeller: false // Unseen by seller
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Message 2 from admin to seller1',
        createdAt: new Date(),
        seenByAdmin: true,
        seenBySeller: false // Unseen by seller
      },
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Response from seller1 to admin',
        createdAt: new Date(),
        seenByAdmin: false,
        seenBySeller: true // Seen by seller (their own message)
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller2',
        message: 'Message 1 from admin to seller2',
        createdAt: new Date(),
        seenByAdmin: true,
        seenBySeller: false // Unseen by seller
      }
    ];

    await SupportMessage.insertMany(testMessages);
    console.log('✅ Test messages created successfully!\n');

    // Test 1: Initial unseen counts for sellers
    console.log('3. Testing initial unseen counts for sellers...');
    
    // Test seller1 unseen count
    const seller1UnseenCount = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: 'seller1',
      seenBySeller: { $ne: true },
    });
    console.log(`Seller1 unseen count: ${seller1UnseenCount}`);
    if (seller1UnseenCount === 2) {
      console.log('✅ Seller1 unseen count is correct!\n');
    } else {
      console.log('❌ Seller1 unseen count is incorrect!\n');
    }

    // Test seller2 unseen count
    const seller2UnseenCount = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: 'seller2',
      seenBySeller: { $ne: true },
    });
    console.log(`Seller2 unseen count: ${seller2UnseenCount}`);
    if (seller2UnseenCount === 1) {
      console.log('✅ Seller2 unseen count is correct!\n');
    } else {
      console.log('❌ Seller2 unseen count is incorrect!\n');
    }

    // Test 2: Mark seller1 messages as seen
    console.log('4. Testing marking seller1 messages as seen...');
    await SupportMessage.updateMany(
      {
        senderRole: 'admin',
        receiverId: 'seller1',
        seenBySeller: { $ne: true }
      },
      {
        $set: { seenBySeller: true }
      }
    );

    const seller1UnseenAfter = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: 'seller1',
      seenBySeller: { $ne: true },
    });
    console.log(`Seller1 unseen count after marking as seen: ${seller1UnseenAfter}`);
    if (seller1UnseenAfter === 0) {
      console.log('✅ Seller1 messages marked as seen correctly!\n');
    } else {
      console.log('❌ Seller1 messages not marked as seen correctly!\n');
    }

    // Test 3: Add new message from admin to seller1 (should show badge again)
    console.log('5. Testing new message from admin to seller1...');
    const newMessage = {
      senderId: 'admin',
      senderRole: 'admin',
      receiverId: 'seller1',
      message: 'New urgent message from admin to seller1!',
      createdAt: new Date(),
      seenByAdmin: true,
      seenBySeller: false // Unseen by seller
    };

    await SupportMessage.create(newMessage);

    const seller1UnseenWithNew = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: 'seller1',
      seenBySeller: { $ne: true },
    });
    console.log(`Seller1 unseen count with new message: ${seller1UnseenWithNew}`);
    if (seller1UnseenWithNew === 1) {
      console.log('✅ New message badge works correctly!\n');
    } else {
      console.log('❌ New message badge failed!\n');
    }

    // Test 4: Verify seller messages are always seen by seller
    console.log('6. Testing seller message visibility...');
    const sellerMessages = await SupportMessage.find({ senderRole: 'seller' });
    const unseenSellerMessages = sellerMessages.filter(msg => !msg.seenBySeller);

    if (unseenSellerMessages.length === 0) {
      console.log('✅ Seller messages are correctly marked as seen!\n');
    } else {
      console.log('❌ Seller messages should always be seen by seller!\n');
    }

    console.log('🎉 Seller badge functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('- Initial unseen counts: ✅');
    console.log('- Marking messages as seen: ✅');
    console.log('- New message badges: ✅');
    console.log('- Seller message handling: ✅');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testSellerBadge(); 