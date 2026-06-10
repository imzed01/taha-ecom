import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taha-ecom';

async function setup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define schemas
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'seller'], required: true },
      storeName: String,
      idImage: String,
      verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      rejectionReason: String,
    }, { timestamps: true });

    const productSchema = new mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      image: { type: String, required: true },
      category: { type: String, required: true },
      isActive: { type: Boolean, default: true },
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);
    const Product = mongoose.model('Product', productSchema);

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@taha.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const admin = new User({
        email: 'admin@taha.com',
        password: hashedPassword,
        role: 'admin',
      });
      await admin.save();
      console.log('Admin user created: admin@taha.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Create sample products
    const sampleProducts = [
      {
        title: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
        price: 99.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Electronics',
      },
      {
        title: 'Smartphone Case',
        description: 'Durable protective case for smartphones with shock absorption',
        price: 19.99,
        image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400',
        category: 'Accessories',
      },
      {
        title: 'Laptop Stand',
        description: 'Adjustable laptop stand for better ergonomics and cooling',
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        category: 'Accessories',
      },
      {
        title: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking and silent clicks',
        price: 29.99,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        category: 'Electronics',
      },
      {
        title: 'USB-C Cable',
        description: 'Fast charging USB-C cable, 3ft length with braided design',
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        category: 'Accessories',
      },
      {
        title: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with customizable switches',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
        category: 'Electronics',
      },
      {
        title: 'Gaming Headset',
        description: '7.1 surround sound gaming headset with noise-canceling microphone',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Electronics',
      },
      {
        title: 'Phone Stand',
        description: 'Adjustable phone stand for desk or bedside use',
        price: 15.99,
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        category: 'Accessories',
      },
      {
        title: 'Power Bank',
        description: '20000mAh portable power bank with fast charging',
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        category: 'Electronics',
      },
      {
        title: 'Screen Protector',
        description: 'Tempered glass screen protector for smartphones',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400',
        category: 'Accessories',
      },
      {
        title: 'Bluetooth Speaker',
        description: 'Portable waterproof Bluetooth speaker with 20-hour battery',
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Electronics',
      },
      {
        title: 'Cable Organizer',
        description: 'Multi-purpose cable organizer and management system',
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        category: 'Accessories',
      },
      {
        title: 'Webcam',
        description: '1080p HD webcam with built-in microphone and privacy cover',
        price: 69.99,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        category: 'Electronics',
      },
      {
        title: 'Desk Lamp',
        description: 'LED desk lamp with adjustable brightness and color temperature',
        price: 34.99,
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        category: 'Accessories',
      },
      {
        title: 'Wireless Charger',
        description: '15W fast wireless charging pad for smartphones',
        price: 24.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        category: 'Electronics',
      }
    ];

    for (const product of sampleProducts) {
      const exists = await Product.findOne({ title: product.title });
      if (!exists) {
        await Product.create(product);
        console.log(`Product created: ${product.title}`);
      }
    }

    console.log('Setup completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@taha.com / admin123');
    console.log('\nYou can now start the development server with: npm run dev');

  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setup(); 