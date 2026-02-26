/**
 * Marketplace Parser Service
 * Fetches prices from Wildberries and Ozon marketplaces
 */

import axios from 'axios';
import Product from '../models/Product.model';
import MarketplacePrice from '../models/MarketplacePrice.model';

interface MarketplacePriceData {
  price: number;
  available: boolean;
}

export class MarketplaceParserService {
  /**
   * Parse Wildberries product price
   * Uses public WB API (no auth required)
   */
  async parseWildberries(articleWB: string): Promise<MarketplacePriceData | null> {
    try {
      // WB API endpoint for product details
      // Article format: 12345678
      const url = `https://card.wb.ru/cards/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${articleWB}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data?.data?.products?.[0]) {
        const product = response.data.data.products[0];
        const price = product.salePriceU ? product.salePriceU / 100 : null; // Price in kopeks
        
        if (price) {
          return {
            price: Math.round(price),
            available: true
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error parsing WB article ${articleWB}:`, error);
      return null;
    }
  }

  /**
   * Parse Ozon product price
   * Uses Ozon public API (or scraping as fallback)
   */
  async parseOzon(skuOzon: string): Promise<MarketplacePriceData | null> {
    try {
      // Ozon API endpoint (may require API key for production)
      // For now, using public product page scraping as alternative
      const url = `https://api.ozon.ru/composer-api.bx/page/json/v2?url=/product/${skuOzon}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      // Parse response (structure depends on Ozon API)
      if (response.data?.widgetStates) {
        // Try to find price in widget states
        const priceWidget = Object.values(response.data.widgetStates).find((widget: any) => 
          widget?.price || widget?.finalPrice
        ) as any;

        if (priceWidget) {
          const price = priceWidget.finalPrice || priceWidget.price;
          if (price) {
            return {
              price: Math.round(Number(price)),
              available: true
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error parsing Ozon SKU ${skuOzon}:`, error);
      return null;
    }
  }

  /**
   * Update price for single product
   */
  async updateProductPrice(productId: string): Promise<void> {
    try {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return;
      }

      // Parse Wildberries
      if (product.articleWB) {
        const wbData = await this.parseWildberries(product.articleWB);
        if (wbData) {
          await MarketplacePrice.create({
            product: productId,
            marketplace: 'wildberries',
            price: wbData.price,
            available: wbData.available
          });

          // Update product lastPrice and lastChecked
          product.lastPrice = wbData.price;
          product.lastChecked = new Date();
        }
      }

      // Parse Ozon
      if (product.skuOzon) {
        const ozonData = await this.parseOzon(product.skuOzon);
        if (ozonData) {
          await MarketplacePrice.create({
            product: productId,
            marketplace: 'ozon',
            price: ozonData.price,
            available: ozonData.available
          });

          // Update product lastPrice (use Ozon if no WB)
          if (!product.articleWB) {
            product.lastPrice = ozonData.price;
            product.lastChecked = new Date();
          }
        }
      }

      await product.save();
    } catch (error) {
      console.error(`Error updating price for product ${productId}:`, error);
    }
  }

  /**
   * Update all product prices
   * Should be called by cron job every hour
   */
  async updateAllPrices(): Promise<void> {
    try {
      console.log('🔄 Starting marketplace price update...');

      const products = await Product.find({
        isActive: true,
        $or: [
          { articleWB: { $exists: true, $ne: null } },
          { skuOzon: { $exists: true, $ne: null } }
        ]
      }).select('_id articleWB skuOzon name');

      console.log(`📦 Found ${products.length} products with marketplace links`);

      let successCount = 0;
      let errorCount = 0;

      for (const product of products) {
        try {
          await this.updateProductPrice(product._id.toString());
          successCount++;
          
          // Rate limiting - wait 2 seconds between requests to avoid blocking
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Failed to update ${product.name}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Price update complete: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error('Error in updateAllPrices:', error);
    }
  }

  /**
   * Get price history for product
   */
  async getPriceHistory(productId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prices = await MarketplacePrice.find({
      product: productId,
      fetchedAt: { $gte: startDate }
    })
      .sort({ fetchedAt: 1 })
      .lean();

    // Group by marketplace
    const wbPrices = prices
      .filter(p => p.marketplace === 'wildberries')
      .map(p => ({ price: p.price, date: p.fetchedAt }));

    const ozonPrices = prices
      .filter(p => p.marketplace === 'ozon')
      .map(p => ({ price: p.price, date: p.fetchedAt }));

    return {
      wildberries: wbPrices,
      ozon: ozonPrices
    };
  }
}

export default new MarketplaceParserService();
