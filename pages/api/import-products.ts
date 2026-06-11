import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';
import Product from '../../models/Product';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.secret !== 'import-taha-2024') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    let imported = 0;
    let skipped = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://www.essbyebay.store/api/products?limit=500&page=${page}`
      );
      const data = await response.json();
      const products = data.products || data;

      if (!products || products.length === 0) {
        hasMore = false;
        break;
      }

      for (const p of products) {
        const exists = await Product.findOne({ title: p.title });
        if (!exists) {
          await Product.create({
            title: p.title,
            description: p.description,
            price: p.price,
            image: p.image,
            category: p.category,
            isActive: true,
          });
          imported++;
        } else {
          skipped++;
        }
      }

      // If we got less than 500, we've reached the last page
      if (products.length < 500) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return res.status(200).json({
      message: `Done! Imported: ${imported}, Skipped: ${skipped}, Pages: ${page}`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ message: 'Error', error: message });
  }
}
