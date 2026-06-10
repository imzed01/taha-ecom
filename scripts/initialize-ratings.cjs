const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom";
mongoose.connect(MONGODB_URI);

// Define User schema (simplified version for this script)
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
});

const User = mongoose.model('User', userSchema);

async function initializeRatings() {
  try {
    console.log('Starting rating initialization...');

    // Find all sellers
    const sellers = await User.find({ role: 'seller' });
    console.log(`Found ${sellers.length} sellers`);

    let updatedCount = 0;

    for (const seller of sellers) {
      // Check if seller already has rating fields
      if (seller.rating === undefined || seller.ratingCount === undefined) {
        // Set default rating (5 stars) and count (0)
        seller.rating = 5;
        seller.ratingCount = 0;
        await seller.save();
        updatedCount++;
        console.log(`Updated seller: ${seller.email}`);
      }
    }

    console.log(`\nRating initialization complete!`);
    console.log(`Updated ${updatedCount} sellers`);
    console.log(`Total sellers: ${sellers.length}`);

  } catch (error) {
    console.error('Error initializing ratings:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
initializeRatings(); 