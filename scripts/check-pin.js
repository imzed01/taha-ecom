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

async function checkPins() {
  try {
    console.log('Checking transaction PINs in database...\n');
    
    const users = await User.find({ role: 'seller' }).select('email transactionPin storeName');
    
    console.log(`Found ${users.length} seller users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.storeName})`);
      console.log(`   PIN: "${user.transactionPin}" (type: ${typeof user.transactionPin}, length: ${user.transactionPin?.length})`);
      console.log(`   Has PIN: ${!!user.transactionPin}\n`);
    });
    
    // Check for users without PINs
    const usersWithoutPin = users.filter(user => !user.transactionPin);
    if (usersWithoutPin.length > 0) {
      console.log(`\n⚠️  ${usersWithoutPin.length} users without transaction PINs:`);
      usersWithoutPin.forEach(user => {
        console.log(`   - ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking PINs:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkPins(); 