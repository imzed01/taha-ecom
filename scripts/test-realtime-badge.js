const mongoose = require('mongoose');

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

async function testRealtimeBadge() {
  try {
    console.log('Testing real-time badge functionality...');
    
    // Add a new message from seller2 (simulating a new message while admin is viewing seller1)
    const newMessage = {
      senderId: 'seller2',
      senderRole: 'seller',
      receiverId: 'admin',
      message: 'New urgent message from seller2!',
      createdAt: new Date(),
      seenByAdmin: false
    };
    
    await SupportMessage.create(newMessage);
    
    console.log('Added new message from seller2');
    console.log('Expected behavior:');
    console.log('- If admin is viewing seller1 chat, seller2 should show badge with count 2');
    console.log('- Badge should appear immediately (real-time)');
    console.log('- Badge should not appear for seller1 (since admin is viewing that chat)');
    
    // Check current unseen counts
    const unseenCounts = [];
    const sellers = await SupportMessage.distinct('senderId', { senderRole: 'seller' });
    
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
    
    console.log('\nCurrent unseen message counts:', unseenCounts);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testRealtimeBadge(); 