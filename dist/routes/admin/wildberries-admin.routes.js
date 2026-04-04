"use strict";
/**
 * Wildberries Admin Routes
 * Manage Wildberries integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wildberries_service_1 = __importDefault(require("../../services/wildberries.service"));
const Product_model_1 = __importDefault(require("../../models/Product.model"));
const MarketplacePrice_model_1 = __importDefault(require("../../models/MarketplacePrice.model"));
const Settings_model_1 = __importDefault(require("../../models/Settings.model"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = express_1.default.Router();
// All routes require admin authentication
router.use(authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware);
/**
 * GET /api/admin/wildberries/status
 * Check WB API connection status
 */
router.get('/status', async (req, res) => {
    try {
        const isConfigured = wildberries_service_1.default.isConfigured();
        if (!isConfigured) {
            return res.json({
                connected: false,
                message: 'WB_API_TOKEN not configured'
            });
        }
        // Try to fetch prices as a test
        const testResult = await wildberries_service_1.default.getPrices([]);
        res.json({
            connected: true,
            message: 'Wildberries API connected successfully',
            tokenExpiry: 'Check .env for token expiration date'
        });
    }
    catch (error) {
        res.status(500).json({
            connected: false,
            error: error?.message || 'Connection failed'
        });
    }
});
/**
 * POST /api/admin/wildberries/sync-prices
 * Sync prices from WB for all products with articleWB
 */
router.post('/sync-prices', async (req, res) => {
    try {
        const products = await Product_model_1.default.find({
            articleWB: { $exists: true, $ne: null }
        }).select('articleWB name');
        if (products.length === 0) {
            return res.json({
                message: 'No products with WB articles found',
                synced: 0
            });
        }
        const nmIds = products.map(p => Number(p.articleWB));
        const prices = await wildberries_service_1.default.getPrices(nmIds);
        let syncedCount = 0;
        for (const product of products) {
            const price = prices.get(Number(product.articleWB));
            if (price) {
                // Save to MarketplacePrice history
                await MarketplacePrice_model_1.default.create({
                    product: product._id,
                    marketplace: 'wildberries',
                    price: price,
                    available: true,
                    fetchedAt: new Date()
                });
                syncedCount++;
            }
        }
        res.json({
            message: `Synced ${syncedCount} prices from Wildberries`,
            total: products.length,
            synced: syncedCount
        });
    }
    catch (error) {
        console.error('Error syncing WB prices:', error);
        res.status(500).json({ error: 'Failed to sync prices' });
    }
});
/**
 * GET /api/admin/wildberries/product/:nmId
 * Get product info from WB
 */
router.get('/product/:nmId', async (req, res) => {
    try {
        const nmId = Number(req.params.nmId);
        const productInfo = await wildberries_service_1.default.getProductInfo(nmId);
        if (!productInfo) {
            return res.status(404).json({ error: 'Product not found on WB' });
        }
        res.json(productInfo);
    }
    catch (error) {
        console.error('Error fetching WB product:', error);
        res.status(500).json({ error: 'Failed to fetch product info' });
    }
});
/**
 * POST /api/admin/wildberries/update-price
 * Update product price on WB
 * Body: { nmId: number, price: number }
 */
router.post('/update-price', async (req, res) => {
    try {
        const { nmId, price } = req.body;
        if (!nmId || !price) {
            return res.status(400).json({
                error: 'nmId and price are required'
            });
        }
        const success = await wildberries_service_1.default.updatePrice(nmId, price);
        if (success) {
            res.json({
                message: `Price updated for nmID ${nmId}`,
                nmId,
                price
            });
        }
        else {
            res.status(500).json({ error: 'Failed to update price' });
        }
    }
    catch (error) {
        console.error('Error updating WB price:', error);
        res.status(500).json({ error: 'Failed to update price' });
    }
});
/**
 * GET /api/admin/wildberries/sales-report
 * Get sales statistics
 * Query: dateFrom, dateTo (YYYY-MM-DD)
 */
router.get('/sales-report', async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        if (!dateFrom || !dateTo) {
            return res.status(400).json({
                error: 'dateFrom and dateTo are required (format: YYYY-MM-DD)'
            });
        }
        const report = await wildberries_service_1.default.getSalesReport(dateFrom, dateTo);
        res.json({
            dateFrom,
            dateTo,
            recordsCount: report.length,
            data: report
        });
    }
    catch (error) {
        console.error('Error fetching WB sales report:', error);
        res.status(500).json({ error: 'Failed to fetch sales report' });
    }
});
/**
 * GET /api/admin/wildberries/token
 * Get current WB API token (masked)
 */
router.get('/token', async (req, res) => {
    try {
        const settings = await Settings_model_1.default.findOne({ key: 'WB_API_TOKEN' });
        if (!settings) {
            return res.json({ token: '' });
        }
        // Возвращаем замаскированный токен (первые 10 символов)
        const maskedToken = settings.value.substring(0, 10) + '***';
        res.json({
            token: settings.value, // Для редактирования
            masked: maskedToken,
            configured: true
        });
    }
    catch (error) {
        console.error('Error fetching WB token:', error);
        res.status(500).json({ error: 'Failed to fetch token' });
    }
});
/**
 * POST /api/admin/wildberries/token
 * Update WB API token
 */
router.post('/token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string' || token.trim().length === 0) {
            return res.status(400).json({ error: 'Token is required' });
        }
        // Сохраняем или обновляем токен в БД
        await Settings_model_1.default.findOneAndUpdate({ key: 'WB_API_TOKEN' }, {
            key: 'WB_API_TOKEN',
            value: token.trim(),
            encrypted: false
        }, { upsert: true, new: true });
        // Обновляем токен в сервисе
        wildberries_service_1.default.updateToken(token.trim());
        res.json({
            success: true,
            message: 'Token updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating WB token:', error);
        res.status(500).json({ error: 'Failed to update token' });
    }
});
exports.default = router;
