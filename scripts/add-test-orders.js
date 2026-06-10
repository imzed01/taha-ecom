import mongoose from 'mongoose';

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom';

// Mongoose Schemas
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

const orderSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  commission: {
    type: Number,
    required: true,
    min: 0,
  },
  buyerName: {
    type: String,
    required: true,
  },
  buyerEmail: {
    type: String,
    required: true,
  },
  buyerPhone: {
    type: String,
    required: true,
  },
  buyerAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'on_the_way', 'delivered'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  transactionId: String,
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
const Product = mongoose.model('Product', productSchema);

// Current seller ID from the logs
const SELLER_ID = '6875764dab3c52f2d7776b35';

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get some products to create orders for
    const products = await Product.find({ isActive: true }).limit(5);
    
    if (products.length === 0) {
      console.log('❌ No products found. Please add products first.');
      return;
    }

    console.log(`📦 Found ${products.length} products to create orders for`);

    // Create test orders
    const testOrders = [
      {
        sellerId: SELLER_ID,
        productId: products[0]._id,
        quantity: 2,
        totalAmount: products[0].price * 2,
        commission: (products[0].price * 2) * 0.15,
        buyerName: 'John Doe',
        buyerEmail: 'john.doe@example.com',
        buyerPhone: '+1234567890',
        buyerAddress: '123 Main St, City, State 12345',
        status: 'pending',
        paymentStatus: 'paid',
      },
      {
        sellerId: SELLER_ID,
        productId: products[1]?._id || products[0]._id,
        quantity: 1,
        totalAmount: (products[1]?.price || products[0].price),
        commission: ((products[1]?.price || products[0].price) * 0.15),
        buyerName: 'Jane Smith',
        buyerEmail: 'jane.smith@example.com',
        buyerPhone: '+0987654321',
        buyerAddress: '456 Oak Ave, Town, State 67890',
        status: 'confirmed',
        paymentStatus: 'paid',
      },
      {
        sellerId: SELLER_ID,
        productId: products[2]?._id || products[0]._id,
        quantity: 3,
        totalAmount: (products[2]?.price || products[0].price) * 3,
        commission: ((products[2]?.price || products[0].price) * 3 * 0.15),
        buyerName: 'Bob Johnson',
        buyerEmail: 'bob.johnson@example.com',
        buyerPhone: '+1122334455',
        buyerAddress: '789 Pine Rd, Village, State 11111',
        status: 'on_the_way',
        paymentStatus: 'paid',
      },
    ];

    let addedCount = 0;
    for (const orderData of testOrders) {
      try {
        await Order.create(orderData);
        addedCount++;
        console.log(`✅ Created order ${addedCount}: ${orderData.buyerName} - ${orderData.status}`);
      } catch (err) {
        console.error(`❌ Error creating order:`, err.message);
      }
    }

    console.log(`\n✅ Finished! Created ${addedCount} test orders for seller ${SELLER_ID}`);
    console.log('📊 Total orders for this seller:', await Order.countDocuments({ sellerId: SELLER_ID }));
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
})(); 