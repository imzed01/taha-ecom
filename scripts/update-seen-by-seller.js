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

async function updateSeenBySeller() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Updating existing messages with seenBySeller field...');

    // Set seenBySeller: true for all seller messages (since sellers see their own messages immediately)
    const sellerMessagesResult = await SupportMessage.updateMany(
      { senderRole: 'seller' },
      { $set: { seenBySeller: true } }
    );
    console.log(`✅ Updated ${sellerMessagesResult.modifiedCount} seller messages with seenBySeller: true`);

    // Set seenBySeller: false for all admin messages (they will be marked as seen when seller views them)
    const adminMessagesResult = await SupportMessage.updateMany(
      { senderRole: 'admin' },
      { $set: { seenBySeller: false } }
    );
    console.log(`✅ Updated ${adminMessagesResult.modifiedCount} admin messages with seenBySeller: false`);

    // Count total messages
    const totalMessages = await SupportMessage.countDocuments();
    console.log(`📊 Total messages in database: ${totalMessages}`);

    console.log('🎉 Successfully updated all messages with seenBySeller field!');
  } catch (error) {
    console.error('❌ Error updating messages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateSeenBySeller(); 