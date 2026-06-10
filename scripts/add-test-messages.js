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

async function addTestMessages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const sellerId = '6875764dab3c52f2d7776b35';
    
    console.log(`Adding test messages for seller: ${sellerId}`);

    // Add some test messages
    const testMessages = [
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: sellerId,
        message: 'Hello! Welcome to our support chat. How can I help you today?',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        seenByAdmin: true,
        seenBySeller: false // Unseen by seller
      },
      {
        senderId: sellerId,
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Hi! I have a question about my product listing.',
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        seenByAdmin: false,
        seenBySeller: true // Seen by seller (their own message)
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: sellerId,
        message: 'Sure! What would you like to know about your product listing?',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        seenByAdmin: true,
        seenBySeller: false // Unseen by seller
      },
      {
        senderId: sellerId,
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'I want to know how to add more images to my product.',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        seenByAdmin: false,
        seenBySeller: true // Seen by seller (their own message)
      },
      {
        senderId: 'admin',
        senderRole: 'admin',
        receiverId: sellerId,
        message: 'You can add more images by going to your product edit page and clicking the "Add Image" button. You can upload up to 5 images per product.',
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        seenByAdmin: true,
        seenBySeller: false // Unseen by seller
      }
    ];

    await SupportMessage.insertMany(testMessages);
    console.log(`✅ Added ${testMessages.length} test messages for seller ${sellerId}`);

    // Verify the messages were added
    const sellerMessages = await SupportMessage.find({
      $or: [
        { senderId: sellerId, senderRole: 'seller', receiverId: 'admin' },
        { senderRole: 'admin', receiverId: sellerId },
      ],
    });

    console.log(`\nTotal messages for seller ${sellerId}: ${sellerMessages.length}`);
    
    // Check unseen count
    const unseenCount = await SupportMessage.countDocuments({
      senderRole: 'admin',
      receiverId: sellerId,
      seenBySeller: { $ne: true },
    });
    
    console.log(`Unseen messages for seller: ${unseenCount}`);
    console.log('🎉 Test messages added successfully!');
    console.log('\n💡 Now when you visit the chat page, you should see these messages.');
    console.log('   The badge should show 3 unseen messages initially.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addTestMessages(); 