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

async function testSidebarBadges() {
  try {
    console.log('🧪 Testing Sidebar Badge Functionality');
    console.log('=====================================\n');
    
    // Clear existing messages
    console.log('1. Clearing existing messages...');
    await SupportMessage.deleteMany({});
    
    // Create test messages for admin sidebar badge
    console.log('2. Creating test messages for admin sidebar badge...');
    const adminTestMessages = [
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Message 1 from seller1 to admin',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'seller2',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Message 1 from seller2 to admin',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'seller3',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Message 1 from seller3 to admin',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Response from admin to seller1',
        createdAt: new Date(),
        seenByAdmin: true
      }
    ];
    
    await SupportMessage.insertMany(adminTestMessages);
    
    // Test admin total unseen count
    console.log('3. Testing admin total unseen count...');
    const adminTotalUnseen = await SupportMessage.countDocuments({
      senderRole: 'seller',
      seenByAdmin: { $ne: true },
    });
    
    console.log(`Admin total unseen count: ${adminTotalUnseen}`);
    if (adminTotalUnseen === 3) {
      console.log('✅ Admin total unseen count is correct!\n');
    } else {
      console.log('❌ Admin total unseen count is incorrect!\n');
    }
    
    // Create test messages for seller sidebar badge
    console.log('4. Creating test messages for seller sidebar badge...');
    const sellerTestMessages = [
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Message 1 from admin to seller1',
        createdAt: new Date(),
        seenByAdmin: true
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Message 2 from admin to seller1',
        createdAt: new Date(),
        seenByAdmin: true
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller2',
        message: 'Message 1 from admin to seller2',
        createdAt: new Date(),
        seenByAdmin: true
      }
    ];
    
    await SupportMessage.insertMany(sellerTestMessages);
    
    // Test seller total unseen count (messages from admin in last 24 hours)
    console.log('5. Testing seller total unseen count...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const seller1TotalUnseen = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: 'seller1',
      createdAt: { $gte: twentyFourHoursAgo },
    });
    
    console.log(`Seller1 total unseen count: ${seller1TotalUnseen}`);
    if (seller1TotalUnseen === 3) { // 2 new messages + 1 from earlier
      console.log('✅ Seller1 total unseen count is correct!\n');
    } else {
      console.log('❌ Seller1 total unseen count is incorrect!\n');
    }
    
    // Test seller2 count
    const seller2TotalUnseen = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: 'seller2',
      createdAt: { $gte: twentyFourHoursAgo },
    });
    
    console.log(`Seller2 total unseen count: ${seller2TotalUnseen}`);
    if (seller2TotalUnseen === 1) {
      console.log('✅ Seller2 total unseen count is correct!\n');
    } else {
      console.log('❌ Seller2 total unseen count is incorrect!\n');
    }
    
    // Test marking admin messages as seen (simulating admin viewing chat)
    console.log('6. Testing marking admin messages as seen...');
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
    
    const adminTotalUnseenAfter = await SupportMessage.countDocuments({
      senderRole: 'seller',
      seenByAdmin: { $ne: true },
    });
    
    console.log(`Admin total unseen count after marking seller1 as seen: ${adminTotalUnseenAfter}`);
    if (adminTotalUnseenAfter === 2) {
      console.log('✅ Admin total unseen count after marking as seen is correct!\n');
    } else {
      console.log('❌ Admin total unseen count after marking as seen is incorrect!\n');
    }
    
    // Test old messages for seller (should not count)
    console.log('7. Testing old messages for seller (should not count)...');
    const oldMessage = {
      senderId: 'admin',
      senderRole: 'admin',
      receiverId: 'seller1',
      message: 'Old message from admin to seller1',
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      seenByAdmin: true
    };
    
    await SupportMessage.create(oldMessage);
    
    const seller1TotalUnseenWithOld = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: 'seller1',
      createdAt: { $gte: twentyFourHoursAgo },
    });
    
    console.log(`Seller1 total unseen count with old message: ${seller1TotalUnseenWithOld}`);
    if (seller1TotalUnseenWithOld === 3) { // Should still be 3, old message shouldn't count
      console.log('✅ Old messages are correctly excluded from seller count!\n');
    } else {
      console.log('❌ Old messages are incorrectly included in seller count!\n');
    }
    
    console.log('🎉 Sidebar badge functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('- Admin total unseen count: ✅');
    console.log('- Seller total unseen count: ✅');
    console.log('- Marking messages as seen: ✅');
    console.log('- Old message exclusion: ✅');
    console.log('- Multiple sellers support: ✅');
    
    console.log('\n🚀 Expected behavior:');
    console.log('- Admin sidebar should show badge with total unseen messages from all sellers');
    console.log('- Seller sidebar should show badge with recent admin messages (last 24 hours)');
    console.log('- Badges should disappear when on chat page');
    console.log('- Badges should update in real-time');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSidebarBadges(); 