/**
 * Wildberries Admin Routes
 * Manage Wildberries integration
 */

import express from 'express';
import wildberriesService from '../../services/wildberries.service';
import Product from '../../models/Product.model';
import MarketplacePrice from '../../models/MarketplacePrice.model';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, adminMiddleware);

/**
 * GET /api/admin/wildberries/status
 * Check WB API connection status
 */
router.get('/status', async (req, res) => {
  try {
    const isConfigured = wildberriesService.isConfigured();
    
    if (!isConfigured) {
      return res.json({
        connected: false,
        message: 'WB_API_TOKEN not configured'
      });
    }

    // Try to fetch prices as a test
    const testResult = await wildberriesService.getPrices([]);
    
    res.json({
      connected: true,
      message: 'Wildberries API connected successfully',
      tokenExpiry: 'Check .env for token expiration date'
    });
  } catch (error: any) {
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
    const products = await Product.find({ 
      articleWB: { $exists: true, $ne: null } 
    }).select('articleWB name');

    if (products.length === 0) {
      return res.json({
        message: 'No products with WB articles found',
        synced: 0
      });
    }

    const nmIds = products.map(p => Number(p.articleWB));
    const prices = await wildberriesService.getPrices(nmIds);

    let syncedCount = 0;

    for (const product of products) {
      const price = prices.get(Number(product.articleWB));
      
      if (price) {
        // Save to MarketplacePrice history
        await MarketplacePrice.create({
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
  } catch (error) {
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
    const productInfo = await wildberriesService.getProductInfo(nmId);

    if (!productInfo) {
      return res.status(404).json({ error: 'Product not found on WB' });
    }

    res.json(productInfo);
  } catch (error) {
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

    const success = await wildberriesService.updatePrice(nmId, price);

    if (success) {
      res.json({ 
        message: `Price updated for nmID ${nmId}`,
        nmId,
        price 
      });
    } else {
      res.status(500).json({ error: 'Failed to update price' });
    }
  } catch (error) {
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

    const report = await wildberriesService.getSalesReport(
      dateFrom as string, 
      dateTo as string
    );

    res.json({
      dateFrom,
      dateTo,
      recordsCount: report.length,
      data: report
    });
  } catch (error) {
    console.error('Error fetching WB sales report:', error);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
});

export default router;
