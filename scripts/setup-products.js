import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dbConnect from '../lib/mongodb.js';
import Product from '../models/Product.js';

let addedCount = 0;
let skippedCount = 0;
let errorCount = 0;



// Helper to extract price from string
const extractPrice = (priceStr) => {
  if (!priceStr) return 0;
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(price) ? 0 : price;
};

// Helper to clean HTML entities
const cleanHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

async function setupProducts() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    const filePath = path.resolve('./products_ultimate.json');
    console.log('📁 Reading products from:', filePath);
    
    const rawData = await fs.readFile(filePath, 'utf-8');
    const productsJson = JSON.parse(rawData);
    const products = productsJson.products || [];

    console.log(`📦 Found ${products.length} products in JSON file`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Clean and validate product data
        const title = cleanHtml(product.title || '').trim();
        const description = cleanHtml(product.description || '').trim();
        const price = extractPrice(product.price);
        const category = product.category || 'Uncategorized';
        const image = product.image_url || product.images?.[0] || '';

        // Skip if essential data is missing
        if (!title || !price || price === 0) {
          skippedCount++;
          continue;
        }

        // Check if product already exists (by title)
        const existingProduct = await Product.findOne({ 
          title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (existingProduct) {
          skippedCount++;
          continue;
        }

        // Create new product
        await Product.create({
          title,
          description,
          price,
          category,
          image,
          isActive: true,
        });

        addedCount++;
        
        // Progress update every 100 products
        if (addedCount % 100 === 0) {
          console.log(`📦 Added ${addedCount} products... (${Math.round((i / products.length) * 100)}% complete)`);
        }

      } catch (err) {
        errorCount++;
        if (errorCount <= 10) { // Only log first 10 errors to avoid spam
          console.error(`❌ Error processing product "${product.title}":`, err.message);
        }
      }
    }

    console.log('\n✅ Product setup completed!');
    console.log(`📦 New products added: ${addedCount}`);
    console.log(`⚠️ Skipped (duplicates/invalid): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total products in DB: ${await Product.countDocuments()}`);

  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

setupProducts(); 