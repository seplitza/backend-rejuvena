/**
 * Seed Default Offers
 * Creates default Premium offer for homepage
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Offer from '../models/Offer.model';

dotenv.config();

const defaultOffers = [
  {
    type: 'premium',
    title: 'Премиум доступ',
    subtitle: 'Полный доступ ко всем упражнениям',
    badge: '⭐ Популярный',
    badgeColor: 'bg-yellow-400 text-yellow-900',
    gradient: {
      from: '#9333ea', // purple-600
      to: '#ec4899',   // pink-500
    },
    borderColor: 'border-purple-200 hover:border-purple-400',
    features: [
      {
        title: 'Полное видео-инструкция',
        description: 'Детальная демонстрация каждого упражнения',
      },
      {
        title: 'Доступ на 1 месяц',
        description: '30 дней автоматического доступа',
      },
      {
        title: 'Все категории упражнений',
        description: '100+ видео, лицо, шея, тело + другое',
      },
    ],
    price: 990,
    priceLabel: '/ месяц',
    isVisible: true,
    order: 0,
    showToLoggedIn: true,
    showToGuests: true,
    hiddenIfOwned: true, // Hide if user already has Premium
    buttonText: 'Купить Premium',
  },
];

async function seedOffers() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena'
    );
    console.log('✅ Connected to MongoDB');

    // Check if Premium offer already exists
    const existingPremium = await Offer.findOne({ type: 'premium' });
    if (existingPremium) {
      console.log('⚠️  Premium offer already exists. Skipping seed.');
      console.log('   To re-seed, delete existing offers first.');
      process.exit(0);
    }

    // Insert default offers
    await Offer.insertMany(defaultOffers);
    console.log(`✅ Successfully created ${defaultOffers.length} default offers:`);
    defaultOffers.forEach((offer) => {
      console.log(`   - ${offer.title} (${offer.type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding offers:', error);
    process.exit(1);
  }
}

seedOffers();
