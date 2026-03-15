/**
 * Migration script to set initial order values for existing products
 * Products will be ordered by creation date (oldest first)
 */

import mongoose from 'mongoose';
import Product from '../src/models/Product.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

async function migrateProductOrder() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all products sorted by creation date
    const products = await Product.find({}).sort({ createdAt: 1 });
    
    console.log(`Found ${products.length} products`);

    // Update order for each product
    const updates = products.map((product, index) => {
      return Product.findByIdAndUpdate(product._id, { order: index });
    });

    await Promise.all(updates);

    console.log(`✅ Successfully updated order for ${products.length} products`);
    
    // Verify
    const updatedProducts = await Product.find({}).sort({ order: 1 }).limit(5);
    console.log('\nFirst 5 products by order:');
    updatedProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (order: ${p.order})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateProductOrder();
