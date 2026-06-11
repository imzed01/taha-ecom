const dbConnect = require('../../lib/dbConnect').default;
const User = require('../../models/User').default;
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  if (req.query.secret !== 'setup-taha-2024') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    await User.deleteOne({ email: 'admin@essbyebay.com' });

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create({
      name: 'Admin',
      email: 'admin@essbyebay.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
    });

    return res.status(200).json({ message: 'Admin created successfully!' });
  } catch (error) {
    return res.status(500).json({ message: 'Error', error: error.message });
  }
}
