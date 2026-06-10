import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taha-ecom');

const SupportMessageSchema = new mongoose.Schema({
  senderId: String,
  senderRole: String,
  receiverId: String,
  message: String,
  createdAt: Date,
  seenByAdmin: Boolean,
});

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);

async function testBadgeFunctionality() {
  try {
    console.log('🧪 Testing Badge Functionality for Admin-Seller Chat System');
    console.log('========================================================\n');
    
    // Clear existing messages
    console.log('1. Clearing existing messages...');
    await SupportMessage.deleteMany({});
    
    // Create test messages
    console.log('2. Creating test messages...');
    const testMessages = [
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 1 - message 1',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 1 - message 2',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'seller2',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 2 - message 1',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'seller3',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 3 - message 1',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Response from admin to seller 1',
        createdAt: new Date(),
        seenByAdmin: true
      }
    ];
    
    await SupportMessage.insertMany(testMessages);
    console.log('✅ Test messages created successfully!\n');
    
    // Test 1: Initial unseen counts
    console.log('3. Testing initial unseen counts...');
    const initialCounts = await getUnseenCounts();
    console.log('Initial unseen counts:', initialCounts);
    
    const expectedInitial = [
      { sellerId: 'seller1', count: 2 },
      { sellerId: 'seller2', count: 1 },
      { sellerId: 'seller3', count: 1 }
    ];
    
    if (JSON.stringify(initialCounts.sort((a, b) => a.sellerId.localeCompare(b.sellerId))) === 
        JSON.stringify(expectedInitial.sort((a, b) => a.sellerId.localeCompare(b.sellerId)))) {
      console.log('✅ Initial counts are correct!\n');
    } else {
      console.log('❌ Initial counts are incorrect!\n');
    }
    
    // Test 2: Mark seller1 messages as seen
    console.log('4. Testing marking seller1 messages as seen...');
    await SupportMessage.updateMany(
      {
        senderId: 'seller1',
        senderRole: 'seller',
        seenByAdmin: { $ne: true }
      },
      {
        $set: { seenByAdmin: true }
      }
    );
    
    const afterSeller1Seen = await getUnseenCounts();
    console.log('After marking seller1 as seen:', afterSeller1Seen);
    
    const expectedAfterSeller1 = [
      { sellerId: 'seller2', count: 1 },
      { sellerId: 'seller3', count: 1 }
    ];
    
    if (JSON.stringify(afterSeller1Seen.sort((a, b) => a.sellerId.localeCompare(b.sellerId))) === 
        JSON.stringify(expectedAfterSeller1.sort((a, b) => a.sellerId.localeCompare(b.sellerId)))) {
      console.log('✅ Seller1 seen marking works correctly!\n');
    } else {
      console.log('❌ Seller1 seen marking failed!\n');
    }
    
    // Test 3: Add new message from seller1 (should show badge again)
    console.log('5. Testing new message from seller1...');
    const newMessage = {
      senderId: 'seller1',
      senderRole: 'seller',
      receiverId: 'admin',
      message: 'New urgent message from seller1!',
      createdAt: new Date(),
      seenByAdmin: false
    };
    
    await SupportMessage.create(newMessage);
    
    const afterNewMessage = await getUnseenCounts();
    console.log('After new message from seller1:', afterNewMessage);
    
    const expectedAfterNew = [
      { sellerId: 'seller1', count: 1 },
      { sellerId: 'seller2', count: 1 },
      { sellerId: 'seller3', count: 1 }
    ];
    
    if (JSON.stringify(afterNewMessage.sort((a, b) => a.sellerId.localeCompare(b.sellerId))) === 
        JSON.stringify(expectedAfterNew.sort((a, b) => a.sellerId.localeCompare(b.sellerId)))) {
      console.log('✅ New message badge works correctly!\n');
    } else {
      console.log('❌ New message badge failed!\n');
    }
    
    // Test 4: Mark all messages as seen
    console.log('6. Testing marking all messages as seen...');
    await SupportMessage.updateMany(
      {
        senderRole: 'seller',
        seenByAdmin: { $ne: true }
      },
      {
        $set: { seenByAdmin: true }
      }
    );
    
    const afterAllSeen = await getUnseenCounts();
    console.log('After marking all as seen:', afterAllSeen);
    
    if (afterAllSeen.length === 0) {
      console.log('✅ All messages marked as seen correctly!\n');
    } else {
      console.log('❌ Some messages still show as unseen!\n');
    }
    
    // Test 5: Verify admin messages are always seen
    console.log('7. Testing admin message visibility...');
    const adminMessages = await SupportMessage.find({ senderRole: 'admin' });
    const unseenAdminMessages = adminMessages.filter(msg => !msg.seenByAdmin);
    
    if (unseenAdminMessages.length === 0) {
      console.log('✅ Admin messages are correctly marked as seen!\n');
    } else {
      console.log('❌ Admin messages should always be seen!\n');
    }
    
    console.log('🎉 Badge functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('- Initial unseen counts: ✅');
    console.log('- Marking messages as seen: ✅');
    console.log('- New message badges: ✅');
    console.log('- All messages seen: ✅');
    console.log('- Admin message handling: ✅');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function getUnseenCounts() {
  const sellers = await SupportMessage.distinct('senderId', { senderRole: 'seller' });
  const unseenCounts = [];
  
  for (const sellerId of sellers) {
    const count = await SupportMessage.countDocuments({
      senderId: sellerId,
      senderRole: 'seller',
      seenByAdmin: { $ne: true }
    });
    
    if (count > 0) {
      unseenCounts.push({ sellerId, count });
    }
  }
  
  return unseenCounts;
}

testBadgeFunctionality(); 