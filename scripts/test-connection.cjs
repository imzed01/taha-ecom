const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom';

console.log('Testing MongoDB connection...');
console.log('URI:', MONGODB_URI);

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections in database:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection(); 