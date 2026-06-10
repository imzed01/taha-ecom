const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');

// MongoDB URI - using the same as working add-admin script
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom';

console.log('🧪 Starting test setup for TahaEcom (first 100 products)...\n');

// User Schema (matching the current User model)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  plainPassword: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
  },
  transactionPin: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
  },
  role: {
    type: String,
    enum: ["admin", "seller"],
    required: true,
  },
  username: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
    unique: true,
    lowercase: true,
    trim: true,
  },
  storeName: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
  },
  idImageFront: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
  },
  idImageBack: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  rejectionReason: {
    type: String,
  },
  referralCode: {
    type: String,
    required: function () {
      return this.role === "seller";
    },
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
    required: function () {
      return this.role === "seller";
    },
  },
  ratingCount: {
    type: Number,
    default: 0,
    required: function () {
      return this.role === "seller";
    },
  },
}, {
  timestamps: true,
});

// Product Schema (matching the current Product model)
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

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
  console.log('\n📦 Setting up products (test - first 100)...');
  
  try {
    const filePath = path.resolve('./products_ultimate.json');
    console.log('📁 Reading products from:', filePath);
    
    const rawData = await fs.readFile(filePath, 'utf-8');
    const productsJson = JSON.parse(rawData);
    const products = productsJson.products || [];

    console.log(`📦 Found ${products.length} products in JSON file`);
    console.log(`🧪 Processing first 100 products for test...`);

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Only process first 100 products for testing
    const testProducts = products.slice(0, 100);

    for (let i = 0; i < testProducts.length; i++) {
      const product = testProducts[i];
      
      try {
        // Clean and validate product data
        const title = cleanHtml(product.title || '').trim();
        const description = cleanHtml(product.description || '').trim();
        const price = extractPrice(product.price);
        const category = product.category || 'Uncategorized';
        const image = product.image_url || product.images?.[0] || '';

        // Skip if essential data is missing
        if (!title || !price || price === 0 || !description) {
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
        
        // Progress update every 10 products
        if (addedCount % 10 === 0) {
          console.log(`📦 Added ${addedCount} products... (${Math.round((i / testProducts.length) * 100)}% complete)`);
        }

      } catch (err) {
        errorCount++;
        console.error(`❌ Error processing product "${product.title}":`, err.message);
      }
    }

    console.log('\n✅ Test product setup completed!');
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

async function testSetup() {
  try {
    // Use the same connection approach as add-admin script
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Setup admin user
    const adminSuccess = await setupAdmin();
    
    // Setup products (test)
    const productsSuccess = await setupProducts();

    console.log('\n🎉 Test Setup Summary:');
    console.log(`👤 Admin setup: ${adminSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`📦 Products setup: ${productsSuccess ? '✅ Success' : '❌ Failed'}`);
    
    if (adminSuccess && productsSuccess) {
      console.log('\n🎊 Test setup successful! You can now:');
      console.log('1. Login as admin at: http://localhost:3000/auth/signin');
      console.log('2. Use email: admin@taha.com');
      console.log('3. Use password: admin1234');
      console.log('4. Access admin dashboard at: http://localhost:3000/admin/dashboard');
      console.log('\n💡 To add all products, run: npm run setup-complete');
    } else {
      console.log('\n⚠️ Test setup completed with some issues. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Setup error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testSetup(); 