import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import dbConnect from '../lib/mongodb.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

console.log('🚀 Starting complete setup for TahaEcom...\n');

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

async function setupAdmin() {
  console.log('👤 Setting up admin user...');
  
  try {
    const email = 'admin@taha.com';
    const plainPassword = 'admin1234';
    const role = 'admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email, role });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', plainPassword);
      return true;
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
    return true;

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return false;
  }
}

async function setupProducts() {
  console.log('\n📦 Setting up products...');
  
  try {
    const filePath = path.resolve('./products_ultimate.json');
    console.log('📁 Reading products from:', filePath);
    
    const rawData = await fs.readFile(filePath, 'utf-8');
    const productsJson = JSON.parse(rawData);
    const products = productsJson.products || [];

    console.log(`📦 Found ${products.length} products in JSON file`);

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

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
    return true;

  } catch (error) {
    console.error('❌ Error setting up products:', error.message);
    return false;
  }
}

async function completeSetup() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB\n');

    // Setup admin user
    const adminSuccess = await setupAdmin();
    
    // Setup products
    const productsSuccess = await setupProducts();

    console.log('\n🎉 Setup Summary:');
    console.log(`👤 Admin setup: ${adminSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`📦 Products setup: ${productsSuccess ? '✅ Success' : '❌ Failed'}`);
    
    if (adminSuccess && productsSuccess) {
      console.log('\n🎊 Complete setup successful! You can now:');
      console.log('1. Login as admin at: http://localhost:3000/auth/signin');
      console.log('2. Use email: admin@taha.com');
      console.log('3. Use password: admin1234');
      console.log('4. Access admin dashboard at: http://localhost:3000/admin/dashboard');
    } else {
      console.log('\n⚠️ Setup completed with some issues. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Setup error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

completeSetup(); 