"use strict";
/**
 * Cron Jobs - Scheduled tasks for Shop
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const marketplace_parser_service_1 = __importDefault(require("./services/marketplace-parser.service"));
const price_comparison_service_1 = __importDefault(require("./services/price-comparison.service"));
const User_model_1 = __importDefault(require("./models/User.model"));
const WheelSpin_model_1 = __importDefault(require("./models/WheelSpin.model"));
function initCronJobs() {
    console.log('⏰ Initializing cron jobs...');
    /**
     * Update marketplace prices every hour
     * Runs at :05 past every hour (e.g., 10:05, 11:05, 12:05)
     */
    node_cron_1.default.schedule('5 * * * *', async () => {
        console.log('🔄 Running marketplace price update...');
        try {
            await marketplace_parser_service_1.default.updateAllPrices();
        }
        catch (error) {
            console.error('❌ Error in marketplace price update cron:', error);
        }
    });
    /**
     * Check for price alerts (marketplace cheaper than us)
     * Runs daily at 9:00 AM
     */
    node_cron_1.default.schedule('0 9 * * *', async () => {
        console.log('🚨 Checking for price alerts...');
        try {
            const alerts = await price_comparison_service_1.default.getPriceAlerts();
            if (alerts.length > 0) {
                console.log(`⚠️ Found ${alerts.length} products where marketplace is cheaper`);
                // TODO: Send notification to admins
            }
        }
        catch (error) {
            console.error('❌ Error in price alerts cron:', error);
        }
    });
    /**
     * Clean up expired Fortune Wheel spins
     * Runs daily at 3:00 AM
     * Note: WheelSpin collection has TTL index, but this is backup cleanup
     */
    node_cron_1.default.schedule('0 3 * * *', async () => {
        console.log('🧹 Cleaning up expired wheel spins...');
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const result = await WheelSpin_model_1.default.deleteMany({
                createdAt: { $lt: thirtyDaysAgo }
            });
            console.log(`✅ Deleted ${result.deletedCount} expired wheel spins`);
        }
        catch (error) {
            console.error('❌ Error in wheel spin cleanup:', error);
        }
    });
    /**
     * Clean up expired user Fortune Wheel gifts
     * Runs daily at 4:00 AM
     */
    node_cron_1.default.schedule('0 4 * * *', async () => {
        console.log('🧹 Cleaning up expired Fortune Wheel gifts...');
        try {
            const now = new Date();
            const result = await User_model_1.default.updateMany({ 'fortuneWheelGifts.expiry': { $lt: now } }, {
                $pull: {
                    fortuneWheelGifts: {
                        expiry: { $lt: now }
                    }
                }
            });
            console.log(`✅ Cleaned up expired gifts from ${result.modifiedCount} users`);
        }
        catch (error) {
            console.error('❌ Error in gift cleanup:', error);
        }
    });
    /**
     * Clean up expired personal discounts
     * Runs daily at 5:00 AM
     */
    node_cron_1.default.schedule('0 5 * * *', async () => {
        console.log('🧹 Cleaning up expired personal discounts...');
        try {
            const now = new Date();
            const result = await User_model_1.default.updateMany({ personalDiscountExpiry: { $lt: now } }, {
                $set: {
                    personalDiscount: 0,
                    personalDiscountExpiry: null
                }
            });
            console.log(`✅ Cleared expired discounts for ${result.modifiedCount} users`);
        }
        catch (error) {
            console.error('❌ Error in discount cleanup:', error);
        }
    });
    console.log('✅ Cron jobs initialized');
}
