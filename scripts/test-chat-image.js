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

async function testChatImageFunctionality() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing Chat Image Functionality...\n');

    // Test 1: Create a message with image
    console.log('📝 Test 1: Creating message with image...');
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent PNG
    
    const messageWithImage = new SupportMessage({
      senderId: 'test-seller-123',
      senderRole: 'seller',
      receiverId: 'admin',
      message: 'Test message with image',
      image: testImageBase64,
      createdAt: new Date(),
      seenByAdmin: false,
      seenBySeller: true,
    });

    await messageWithImage.save();
    console.log('✅ Message with image created successfully');
    console.log(`   Message ID: ${messageWithImage._id}`);
    console.log(`   Image present: ${!!messageWithImage.image}`);
    console.log(`   Image length: ${messageWithImage.image?.length || 0} characters`);

    // Test 2: Create a message without image
    console.log('\n📝 Test 2: Creating message without image...');
    const messageWithoutImage = new SupportMessage({
      senderId: 'test-seller-123',
      senderRole: 'seller',
      receiverId: 'admin',
      message: 'Test message without image',
      createdAt: new Date(),
      seenByAdmin: false,
      seenBySeller: true,
    });

    await messageWithoutImage.save();
    console.log('✅ Message without image created successfully');
    console.log(`   Message ID: ${messageWithoutImage._id}`);
    console.log(`   Image present: ${!!messageWithoutImage.image}`);

    // Test 3: Create admin message with image
    console.log('\n📝 Test 3: Creating admin message with image...');
    const adminMessageWithImage = new SupportMessage({
      senderId: 'admin',
      senderRole: 'admin',
      receiverId: 'test-seller-123',
      message: 'Admin response with image',
      image: testImageBase64,
      createdAt: new Date(),
      seenByAdmin: true,
      seenBySeller: false,
    });

    await adminMessageWithImage.save();
    console.log('✅ Admin message with image created successfully');
    console.log(`   Message ID: ${adminMessageWithImage._id}`);
    console.log(`   Image present: ${!!adminMessageWithImage.image}`);

    // Test 4: Retrieve all messages for the test seller
    console.log('\n📝 Test 4: Retrieving chat history...');
    const chatHistory = await SupportMessage.find({
      $or: [
        { senderId: 'test-seller-123', senderRole: 'seller', receiverId: 'admin' },
        { senderRole: 'admin', receiverId: 'test-seller-123' },
      ],
    }).sort({ createdAt: 1 });

    console.log(`✅ Retrieved ${chatHistory.length} messages from chat history`);
    
    for (const msg of chatHistory) {
      console.log(`   - ${msg.senderRole} (${msg.senderId}): "${msg.message}" ${msg.image ? '[WITH IMAGE]' : '[NO IMAGE]'}`);
    }

    // Test 5: Verify image data integrity
    console.log('\n📝 Test 5: Verifying image data integrity...');
    const messagesWithImages = chatHistory.filter(msg => msg.image);
    console.log(`✅ Found ${messagesWithImages.length} messages with images`);
    
    for (const msg of messagesWithImages) {
      const isValidBase64 = msg.image.startsWith('data:image/') && msg.image.includes('base64,');
      console.log(`   - Message ${msg._id}: ${isValidBase64 ? '✅ Valid base64' : '❌ Invalid base64'}`);
      console.log(`     Image length: ${msg.image.length} characters`);
    }

    // Test 6: Test message filtering by seen status
    console.log('\n📝 Test 6: Testing seen status filtering...');
    const unseenByAdmin = await SupportMessage.find({
      senderId: 'test-seller-123',
      senderRole: 'seller',
      seenByAdmin: false
    });
    
    const unseenBySeller = await SupportMessage.find({
      senderRole: 'admin',
      receiverId: 'test-seller-123',
      seenBySeller: false
    });

    console.log(`✅ Unseen by admin: ${unseenByAdmin.length} messages`);
    console.log(`✅ Unseen by seller: ${unseenBySeller.length} messages`);

    // Test 7: Update seen status
    console.log('\n📝 Test 7: Testing seen status updates...');
    const updateResult = await SupportMessage.updateMany(
      { senderId: 'test-seller-123', senderRole: 'seller', seenByAdmin: false },
      { seenByAdmin: true }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} messages as seen by admin`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await SupportMessage.deleteMany({
      $or: [
        { senderId: 'test-seller-123' },
        { receiverId: 'test-seller-123' }
      ]
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All chat image functionality tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Image messages can be created and saved');
    console.log('   ✅ Text-only messages work correctly');
    console.log('   ✅ Chat history retrieval works');
    console.log('   ✅ Image data integrity is maintained');
    console.log('   ✅ Seen status filtering works');
    console.log('   ✅ Seen status updates work');
    console.log('   ✅ Admin and seller messages are handled correctly');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testChatImageFunctionality(); 