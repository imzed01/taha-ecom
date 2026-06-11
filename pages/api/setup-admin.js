import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.query.secret !== 'setup-taha-2024') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    // Delete old admin if exists
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
