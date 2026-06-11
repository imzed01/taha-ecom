import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      plainPassword: 'admin123',
      role: 'admin',
      username: 'admin',
      storeName: 'Admin Store',
      verificationStatus: 'verified',
      isVerified: true,
      isBlocked: false,
      rating: 5,
      ratingCount: 0,
    });

    return res.status(200).json({ message: 'Admin created successfully!' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ message: 'Error', error: message });
  }
}
