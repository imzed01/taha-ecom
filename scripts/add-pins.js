const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taha-ecom');

// Define User schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  transactionPin: String,
  role: String,
  storeName: String
});

const User = mongoose.model('User', userSchema);

async function addPins() {
  try {
    console.log('Adding transaction PINs to existing users...\n');
    
    const users = await User.find({ role: 'seller' });
    
    console.log(`Found ${users.length} seller users:\n`);
    
    for (const user of users) {
      if (!user.transactionPin) {
        // Generate a default PIN (1234) for existing users
        const defaultPin = '1234';
        
        user.transactionPin = defaultPin;
        await user.save();
        
        console.log(`✅ Added PIN "${defaultPin}" to ${user.email} (${user.storeName})`);
      } else {
        console.log(`ℹ️  ${user.email} already has PIN: "${user.transactionPin}"`);
      }
    }
    
    console.log('\n✅ All users now have transaction PINs!');
    console.log('Default PIN for all users: 1234');
    console.log('Users should change their PINs after first login.');
    
  } catch (error) {
    console.error('Error adding PINs:', error);
  } finally {
    mongoose.disconnect();
  }
}

addPins(); 