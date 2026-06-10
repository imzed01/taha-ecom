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

const UserSchema = new mongoose.Schema({
  _id: String,
  email: String,
  storeName: String,
  role: String,
});

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);
const User = mongoose.model('User', UserSchema);

async function testCompleteFlow() {
  try {
    console.log('Setting up test data...');
    
    // Create test users
    const testUsers = [
      {
        _id: 'seller1',
        email: 'seller1@test.com',
        storeName: 'Test Store 1',
        role: 'seller'
      },
      {
        _id: 'seller2', 
        email: 'seller2@test.com',
        storeName: 'Test Store 2',
        role: 'seller'
      },
      {
        _id: 'admin',
        email: 'admin@test.com',
        role: 'admin'
      }
    ];
    
    await User.deleteMany({ _id: { $in: ['seller1', 'seller2', 'admin'] } });
    await User.insertMany(testUsers);
    
    // Create test messages
    await SupportMessage.deleteMany({});
    
    const testMessages = [
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 1',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'seller1',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Another message from seller 1',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'seller2',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hello from seller 2',
        createdAt: new Date(),
        seenByAdmin: false
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: 'seller1',
        message: 'Response from admin',
        createdAt: new Date(),
        seenByAdmin: true
      }
    ];
    
    await SupportMessage.insertMany(testMessages);
    
    console.log('Test data created successfully!');
    console.log('\nTest users:');
    console.log('- seller1: Test Store 1 (2 unseen messages)');
    console.log('- seller2: Test Store 2 (1 unseen message)');
    console.log('\nYou can now test the admin chat interface.');
    console.log('Expected behavior:');
    console.log('- seller1 should show badge with count 2');
    console.log('- seller2 should show badge with count 1');
    console.log('- When you click on a seller, their badge should disappear');
    console.log('- Badges should not reappear unless there are new unseen messages');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCompleteFlow(); 