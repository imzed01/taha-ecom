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

async function testUnseenMessages() {
  try {
    console.log('Clearing existing messages...');
    await SupportMessage.deleteMany({});
    
    console.log('Creating test messages...');
    
    // Create some test messages
    const testMessages = [
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 1',
        createdAt: new Date(),
        seenByAdmin: false // Unseen
      },
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Another message from seller 1',
        createdAt: new Date(),
        seenByAdmin: false // Unseen
      },
      {
        senderId: 'seller2',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 2',
        createdAt: new Date(),
        seenByAdmin: false // Unseen
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Response from admin',
        createdAt: new Date(),
        seenByAdmin: true // Admin messages are always seen
      }
    ];
    
    await SupportMessage.insertMany(testMessages);
    
    console.log('Test messages created successfully!');
    
    // Test the unseen count logic
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
    
    console.log('Unseen message counts:', unseenCounts);
    
    // Test marking messages as seen
    console.log('\nMarking seller1 messages as seen...');
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
    
    // Check counts again
    const updatedCounts = [];
    for (const sellerId of sellers) {
      const count = await SupportMessage.countDocuments({
        senderId: sellerId,
        senderRole: 'seller',
        seenByAdmin: { $ne: true }
      });
      
      if (count > 0) {
        updatedCounts.push({ sellerId, count });
      }
    }
    
    console.log('Updated unseen message counts:', updatedCounts);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUnseenMessages(); 