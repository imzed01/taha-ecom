import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom';

// Mongoose Schema
const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  images: [String],
  product_url: String,
  availability: String,
  brand: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Unique index on normalized title + brand
productSchema.index({ title: 1, brand: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);

// Helper to normalize text
const normalize = (text) => (text || '').trim().toLowerCase();

let addedCount = 0;
let skippedCount = 0;

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const filePath = path.resolve('./products_ultimate.json');
    const rawData = await fs.readFile(filePath, 'utf-8');
    const productsJson = JSON.parse(rawData);
    const products = productsJson.products || [];

    for (const product of products) {
      const title = normalize(product.title);
      const brand = normalize(product.brand || 'Unknown');

      const price = parseFloat((product.price || '').replace(/[^0-9.]/g, '')) || 0;

      try {
        if (!title || !price) {
          skippedCount++;
          continue;
        }

        const exists = await Product.findOne({ title, brand });

        if (exists) {
          skippedCount++;
          continue;
        }

        await Product.create({
          title: product.title || '',
          description: product.description || '',
          price,
          category: product.category || 'Uncategorized',
          image: product.image_url || '',
          images: product.images || [],
          product_url: product.product_url || '',
          availability: product.availability || 'Unknown',
          brand: product.brand || 'Unknown',
          isActive: true,
        });

        addedCount++;
        if (addedCount % 100 === 0) {
          console.log(`📦 Added ${addedCount} products...`);
        }
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key error
          skippedCount++;
        } else {
          console.error(`❌ Error adding "${product.title}":`, err.message);
        }
      }
    }

    console.log(`\n✅ Finished! Total new products added: ${addedCount}`);
    console.log(`⚠️ Skipped (duplicates or invalid): ${skippedCount}`);
    console.log('📊 Total products in DB:', await Product.countDocuments());
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
})();
