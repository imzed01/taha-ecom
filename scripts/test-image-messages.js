import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

const SupportMessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['seller', 'admin'], required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  image: { type: String }, // Optional base64 encoded image
  createdAt: { type: Date, default: Date.now },
  seenByAdmin: { type: Boolean, default: false },
  seenBySeller: { type: Boolean, default: false },
});

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);

async function testImageMessages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all messages with images
    const messagesWithImages = await SupportMessage.find({
      image: { $exists: true, $ne: null }
    });

    console.log(`\n📊 Found ${messagesWithImages.length} messages with images:`);
    
    for (const msg of messagesWithImages) {
      console.log(`\n📝 Message ID: ${msg._id}`);
      console.log(`   Sender: ${msg.senderId} (${msg.senderRole})`);
      console.log(`   Receiver: ${msg.receiverId}`);
      console.log(`   Message: "${msg.message}"`);
      console.log(`   Image: ${msg.image ? `[BASE64_${msg.image.length}_chars]` : 'None'}`);
      console.log(`   Created: ${msg.createdAt}`);
      console.log(`   Seen by Admin: ${msg.seenByAdmin}`);
      console.log(`   Seen by Seller: ${msg.seenBySeller}`);
    }

    // Test creating a message with image
    console.log('\n🧪 Testing image message creation...');
    
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent PNG
    
    const testMessage = new SupportMessage({
      senderId: 'test-seller',
      senderRole: 'seller',
      receiverId: 'admin',
      message: 'Test image message',
      image: testImageBase64,
      createdAt: new Date(),
      seenByAdmin: false,
      seenBySeller: true,
    });

    await testMessage.save();
    console.log('✅ Test image message created successfully');

    // Verify it was saved
    const savedMessage = await SupportMessage.findById(testMessage._id);
    console.log('✅ Message retrieved from database');
    console.log(`   Image present: ${!!savedMessage.image}`);
    console.log(`   Image length: ${savedMessage.image?.length || 0} characters`);

    // Clean up test message
    await SupportMessage.findByIdAndDelete(testMessage._id);
    console.log('✅ Test message cleaned up');

    console.log('\n🎉 Image message test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testImageMessages(); 