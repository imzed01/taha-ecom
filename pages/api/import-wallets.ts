import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';
import Wallet from '../../models/Wallet';
import User from '../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.secret !== 'import-taha-2024') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    // Get all sellers from your database
    const sellers = await User.find({ role: 'seller' });

    let created = 0;
    let skipped = 0;

    for (const seller of sellers) {
      const exists = await Wallet.findOne({ sellerId: seller._id });
      if (!exists) {
        await Wallet.create({
          sellerId: seller._id,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
        });
        created++;
      } else {
        skipped++;
      }
    }

    return res.status(200).json({
      message: `Done! Created: ${created} wallets, Skipped: ${skipped}`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ message: 'Error', error: message });
  }
}
