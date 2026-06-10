import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

const SupportMessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['seller', 'admin'], required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  seenByAdmin: { type: Boolean, default: false },
  seenBySeller: { type: Boolean, default: false },
});

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);

async function debugChatStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Chat System Status Check...\n');

    // Check total messages
    const totalMessages = await SupportMessage.countDocuments();
    console.log(`📊 Total messages in database: ${totalMessages}`);

    // Check messages with images
    const messagesWithImages = await SupportMessage.countDocuments({
      image: { $exists: true, $ne: null }
    });
    console.log(`🖼️  Messages with images: ${messagesWithImages}`);

    // Check recent messages
    const recentMessages = await SupportMessage.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('\n📝 Recent messages:');
    for (const msg of recentMessages) {
      console.log(`   - ${msg.senderRole} (${msg.senderId}): "${msg.message}" ${msg.image ? '[WITH IMAGE]' : '[NO IMAGE]'} - ${msg.createdAt.toLocaleString()}`);
    }

    // Check socket endpoint
    console.log('\n🔌 Socket endpoint check:');
    try {
      const response = await fetch('http://localhost:3000/api/support-socket');
      if (response.ok) {
        console.log('   ✅ Socket endpoint is accessible');
      } else {
        console.log('   ❌ Socket endpoint returned:', response.status);
      }
    } catch (error) {
      console.log('   ❌ Socket endpoint error:', error.message);
    }

    // Check chat history endpoint
    console.log('\n📚 Chat history endpoint check:');
    try {
      const response = await fetch('http://localhost:3000/api/support-messages/history?sellerId=test');
      if (response.ok) {
        console.log('   ✅ Chat history endpoint is accessible');
      } else {
        console.log('   ❌ Chat history endpoint returned:', response.status);
      }
    } catch (error) {
      console.log('   ❌ Chat history endpoint error:', error.message);
    }

    console.log('\n🎯 Recommendations:');
    if (totalMessages === 0) {
      console.log('   - No messages found. Try sending a test message.');
    }
    if (messagesWithImages === 0) {
      console.log('   - No image messages found. Try uploading an image.');
    }
    console.log('   - Check browser console for real-time logs');
    console.log('   - Ensure both seller and admin are connected');

  } catch (error) {
    console.error('❌ Error during status check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugChatStatus(); 