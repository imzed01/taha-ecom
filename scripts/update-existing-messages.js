const mongoose = require('mongoose');

// Connect to MongoDB - update the URI if needed
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

async function updateAllMessages() {
  try {
    console.log('Setting seenByAdmin: false for all seller messages...');
    await SupportMessage.updateMany(
      { senderRole: 'seller' },
      { $set: { seenByAdmin: false } }
    );
    console.log('Setting seenByAdmin: true for all admin messages...');
    await SupportMessage.updateMany(
      { senderRole: 'admin' },
      { $set: { seenByAdmin: true } }
    );
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

updateAllMessages(); 