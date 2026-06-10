const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  name: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function addAdmin() {
  await mongoose.connect(MONGODB_URI);

  const email = 'admin@taha.com';
  const plainPassword = 'admin1234';
  const role = 'admin';
  const name = 'Admin';

  const existing = await User.findOne({ email, role });
  if (existing) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = new User({
    email,
    password: hashedPassword,
    role,
    name,
  });
  await admin.save();
  console.log('Admin user created:', { email, password: plainPassword });
  process.exit(0);
}

addAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
}); 