/**
 * Cron Jobs - Scheduled tasks for Shop
 */

import cron from 'node-cron';
import marketplaceParserService from './services/marketplace-parser.service';
import priceComparisonService from './services/price-comparison.service';
import User from './models/User.model';
import WheelSpin from './models/WheelSpin.model';

export function initCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  /**
   * Update marketplace prices every hour
   * Runs at :05 past every hour (e.g., 10:05, 11:05, 12:05)
   */
  cron.schedule('5 * * * *', async () => {
    console.log('🔄 Running marketplace price update...');
    try {
      await marketplaceParserService.updateAllPrices();
    } catch (error) {
      console.error('❌ Error in marketplace price update cron:', error);
    }
  });

  /**
   * Check for price alerts (marketplace cheaper than us)
   * Runs daily at 9:00 AM
   */
  cron.schedule('0 9 * * *', async () => {
    console.log('🚨 Checking for price alerts...');
    try {
      const alerts = await priceComparisonService.getPriceAlerts();
      if (alerts.length > 0) {
        console.log(`⚠️ Found ${alerts.length} products where marketplace is cheaper`);
        // TODO: Send notification to admins
      }
    } catch (error) {
      console.error('❌ Error in price alerts cron:', error);
    }
  });

  /**
   * Clean up expired Fortune Wheel spins
   * Runs daily at 3:00 AM
   * Note: WheelSpin collection has TTL index, but this is backup cleanup
   */
  cron.schedule('0 3 * * *', async () => {
    console.log('🧹 Cleaning up expired wheel spins...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await WheelSpin.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });

      console.log(`✅ Deleted ${result.deletedCount} expired wheel spins`);
    } catch (error) {
      console.error('❌ Error in wheel spin cleanup:', error);
    }
  });

  /**
   * Clean up expired user Fortune Wheel gifts
   * Runs daily at 4:00 AM
   */
  cron.schedule('0 4 * * *', async () => {
    console.log('🧹 Cleaning up expired Fortune Wheel gifts...');
    try {
      const now = new Date();
      
      const result = await User.updateMany(
        { 'fortuneWheelGifts.expiry': { $lt: now } },
        { 
          $pull: { 
            fortuneWheelGifts: { 
              expiry: { $lt: now } 
            } 
          } 
        }
      );

      console.log(`✅ Cleaned up expired gifts from ${result.modifiedCount} users`);
    } catch (error) {
      console.error('❌ Error in gift cleanup:', error);
    }
  });

  /**
   * Clean up expired personal discounts
   * Runs daily at 5:00 AM
   */
  cron.schedule('0 5 * * *', async () => {
    console.log('🧹 Cleaning up expired personal discounts...');
    try {
      const now = new Date();
      
      const result = await User.updateMany(
        { personalDiscountExpiry: { $lt: now } },
        { 
          $set: { 
            personalDiscount: 0,
            personalDiscountExpiry: null
          } 
        }
      );

      console.log(`✅ Cleared expired discounts for ${result.modifiedCount} users`);
    } catch (error) {
      console.error('❌ Error in discount cleanup:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
}
