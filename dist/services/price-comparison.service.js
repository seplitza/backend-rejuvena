"use strict";
/**
 * Price Comparison Service
 * Calculate savings compared to marketplace prices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceComparisonService = void 0;
const Product_model_1 = __importDefault(require("../models/Product.model"));
const MarketplacePrice_model_1 = __importDefault(require("../models/MarketplacePrice.model"));
class PriceComparisonService {
    /**
     * Compare product price with marketplace prices
     */
    async comparePrice(productId) {
        const product = await Product_model_1.default.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        const marketplacePrices = {};
        let bestMarketplacePrice = null;
        // Get latest Wildberries price
        if (product.articleWB) {
            const wbPrice = await MarketplacePrice_model_1.default.findOne({
                product: productId,
                marketplace: 'wildberries'
            })
                .sort({ fetchedAt: -1 })
                .lean();
            if (wbPrice) {
                marketplacePrices.wildberries = wbPrice.price;
                if (!bestMarketplacePrice || wbPrice.price < bestMarketplacePrice) {
                    bestMarketplacePrice = wbPrice.price;
                }
            }
        }
        // Get latest Ozon price
        if (product.skuOzon) {
            const ozonPrice = await MarketplacePrice_model_1.default.findOne({
                product: productId,
                marketplace: 'ozon'
            })
                .sort({ fetchedAt: -1 })
                .lean();
            if (ozonPrice) {
                marketplacePrices.ozon = ozonPrice.price;
                if (!bestMarketplacePrice || ozonPrice.price < bestMarketplacePrice) {
                    bestMarketplacePrice = ozonPrice.price;
                }
            }
        }
        const savings = bestMarketplacePrice
            ? Math.max(0, bestMarketplacePrice - product.price)
            : 0;
        const savingsPercent = bestMarketplacePrice && bestMarketplacePrice > 0
            ? Math.round((savings / bestMarketplacePrice) * 100)
            : 0;
        return {
            ourPrice: product.price,
            marketplacePrices,
            bestMarketplacePrice,
            savings,
            savingsPercent,
            isCheaper: savings > 0
        };
    }
    /**
     * Get all products with significant savings (>10%)
     */
    async getTopDeals(minSavingsPercent = 10, limit = 20) {
        const products = await Product_model_1.default.find({
            isActive: true,
            $or: [
                { articleWB: { $exists: true, $ne: null } },
                { skuOzon: { $exists: true, $ne: null } }
            ]
        }).limit(100); // Process max 100 products
        const deals = [];
        for (const product of products) {
            const comparison = await this.comparePrice(product._id.toString());
            if (comparison.savingsPercent >= minSavingsPercent) {
                deals.push({
                    product: {
                        _id: product._id,
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        slug: product.sku
                    },
                    ...comparison
                });
            }
        }
        // Sort by savings percent descending
        deals.sort((a, b) => b.savingsPercent - a.savingsPercent);
        return deals.slice(0, limit);
    }
    /**
     * Calculate average marketplace price for category
     */
    async getAverageCategoryPrice(categoryId) {
        const products = await Product_model_1.default.find({
            category: categoryId,
            isActive: true
        }).select('price');
        if (products.length === 0) {
            return 0;
        }
        const total = products.reduce((sum, p) => sum + p.price, 0);
        return Math.round(total / products.length);
    }
    /**
     * Price monitoring alert
     * Returns products where marketplace price dropped below our price
     */
    async getPriceAlerts() {
        const products = await Product_model_1.default.find({
            isActive: true,
            $or: [
                { articleWB: { $exists: true, $ne: null } },
                { skuOzon: { $exists: true, $ne: null } }
            ]
        });
        const alerts = [];
        for (const product of products) {
            const comparison = await this.comparePrice(product._id.toString());
            // Alert if marketplace is cheaper (we have negative savings)
            if (comparison.bestMarketplacePrice && comparison.bestMarketplacePrice < product.price) {
                alerts.push({
                    product: {
                        _id: product._id,
                        name: product.name,
                        sku: product.sku
                    },
                    ourPrice: product.price,
                    marketplacePrice: comparison.bestMarketplacePrice,
                    difference: product.price - comparison.bestMarketplacePrice,
                    marketplacePrices: comparison.marketplacePrices
                });
            }
        }
        return alerts;
    }
}
exports.PriceComparisonService = PriceComparisonService;
exports.default = new PriceComparisonService();
