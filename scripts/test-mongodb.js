import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom";

console.log('Testing MongoDB connection...');
console.log('URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

async function testConnection() {
  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
    };

    await mongoose.connect(MONGODB_URI, opts);
    console.log('✅ MongoDB connected successfully!');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection(); 