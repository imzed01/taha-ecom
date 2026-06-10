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

async function checkMessages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const totalMessages = await SupportMessage.countDocuments();
    console.log(`Total messages in database: ${totalMessages}`);
    
    if (totalMessages > 0) {
      const messages = await SupportMessage.find().limit(5);
      console.log('\nSample messages:');
      messages.forEach((m, i) => {
        console.log(`${i + 1}. ${m.senderRole} (${m.senderId}) -> ${m.receiverId}: "${m.message.substring(0, 50)}${m.message.length > 50 ? '...' : ''}"`);
      });
    }
    
    // Check for seller 6875764dab3c52f2d7776b35 specifically
    const sellerMessages = await SupportMessage.find({
      $or: [
        { senderId: '6875764dab3c52f2d7776b35', senderRole: 'seller', receiverId: 'admin' },
        { senderRole: 'admin', receiverId: '6875764dab3c52f2d7776b35' },
      ],
    });
    console.log(`\nMessages for seller 6875764dab3c52f2d7776b35: ${sellerMessages.length}`);
    
    if (sellerMessages.length > 0) {
      console.log('\nSeller messages:');
      sellerMessages.forEach((m, i) => {
        console.log(`${i + 1}. ${m.senderRole} (${m.senderId}) -> ${m.receiverId}: "${m.message}"`);
      });
    }
    
    // Check if there are any admin messages
    const adminMessages = await SupportMessage.find({ senderRole: 'admin' });
    console.log(`\nTotal admin messages: ${adminMessages.length}`);
    
    // Check if there are any seller messages
    const sellerSentMessages = await SupportMessage.find({ senderRole: 'seller' });
    console.log(`Total seller messages: ${sellerSentMessages.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkMessages(); 