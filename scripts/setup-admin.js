import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/mongodb.js';
import User from '../models/User.js';

async function setupAdmin() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    const email = 'admin@taha.com';
    const plainPassword = 'admin1234';
    const role = 'admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email, role });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', plainPassword);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create admin user
    const admin = new User({
      email,
      password: hashedPassword,
      role,
      verificationStatus: 'verified', // Admin is automatically verified
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', plainPassword);
    console.log('👤 Role:', role);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupAdmin(); 