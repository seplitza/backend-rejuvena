/**
 * Wildberries Official API Service
 * Documentation: https://dev.wildberries.ru/
 */

import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface WBProduct {
  nmID: number;
  imtID: number;
  vendorCode: string;
  sizes: Array<{
    price: number;
    discountedPrice: number;
    techSizeName: string;
  }>;
}

interface WBPriceUpdate {
  nmId: number;
  price: number;
}

interface WBStockUpdate {
  sku: string;
  warehouseId: number;
  amount: number;
}

export class WildberriesService {
  private apiClient: AxiosInstance;
  private token: string;

  constructor() {
    this.token = process.env.WB_API_TOKEN || '';
    
    if (!this.token) {
      console.warn('⚠️  WB_API_TOKEN not set in .env - Wildberries integration disabled');
    }

    this.apiClient = axios.create({
      baseURL: 'https://suppliers-api.wildberries.ru',
      headers: {
        'Authorization': this.token,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
  }

  /**
   * Get product info by article (nmID)
   * API: GET /content/v2/get/cards/list
   */
  async getProductInfo(nmId: number): Promise<WBProduct | null> {
    try {
      const response = await this.apiClient.post('/content/v2/get/cards/list', {
        settings: {
          cursor: {
            limit: 1
          },
          filter: {
            withPhoto: -1
          }
        },
        filters: {
          nmIDs: [nmId]
        }
      });

      return response.data?.cards?.[0] || null;
    } catch (error) {
      console.error(`Error fetching WB product ${nmId}:`, error);
      return null;
    }
  }

  /**
   * Get current prices for products
   * API: GET /public/api/v1/info
   */
  async getPrices(nmIds: number[]): Promise<Map<number, number>> {
    try {
      const response = await this.apiClient.get('/public/api/v1/info', {
        params: {
          quantity: 0
        }
      });

      const prices = new Map<number, number>();
      
      if (response.data) {
        response.data.forEach((item: any) => {
          if (nmIds.includes(item.nmID)) {
            prices.set(item.nmID, item.price);
          }
        });
      }

      return prices;
    } catch (error) {
      console.error('Error fetching WB prices:', error);
      return new Map();
    }
  }

  /**
   * Update product price
   * API: POST /public/api/v1/prices
   */
  async updatePrice(nmId: number, price: number): Promise<boolean> {
    try {
      await this.apiClient.post('/public/api/v1/prices', [{
        nmId,
        price
      }]);

      console.log(`✓ Updated WB price for nmID ${nmId}: ${price}₽`);
      return true;
    } catch (error) {
      console.error(`Error updating WB price for ${nmId}:`, error);
      return false;
    }
  }

  /**
   * Update multiple prices at once
   */
  async updatePrices(updates: WBPriceUpdate[]): Promise<number> {
    try {
      await this.apiClient.post('/public/api/v1/prices', updates);
      
      console.log(`✓ Updated ${updates.length} WB prices`);
      return updates.length;
    } catch (error) {
      console.error('Error updating WB prices:', error);
      return 0;
    }
  }

  /**
   * Get stocks (warehouse balances)
   * API: GET /api/v3/stocks/{warehouseId}
   */
  async getStocks(warehouseId: number): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/api/v3/stocks/${warehouseId}`);
      return response.data?.stocks || [];
    } catch (error) {
      console.error(`Error fetching WB stocks for warehouse ${warehouseId}:`, error);
      return [];
    }
  }

  /**
   * Update stock (warehouse balance)
   * API: PUT /api/v3/stocks/{warehouseId}
   */
  async updateStock(warehouseId: number, sku: string, amount: number): Promise<boolean> {
    try {
      await this.apiClient.put(`/api/v3/stocks/${warehouseId}`, {
        stocks: [{
          sku,
          amount
        }]
      });

      console.log(`✓ Updated WB stock for SKU ${sku} at warehouse ${warehouseId}: ${amount}`);
      return true;
    } catch (error) {
      console.error(`Error updating WB stock:`, error);
      return false;
    }
  }

  /**
   * Get orders (new orders to process)
   * API: GET /api/v3/orders/new
   */
  async getNewOrders(dateFrom: Date): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/api/v3/orders/new', {
        params: {
          dateFrom: dateFrom.getTime()
        }
      });

      return response.data?.orders || [];
    } catch (error) {
      console.error('Error fetching WB orders:', error);
      return [];
    }
  }

  /**
   * Get sales statistics
   * API: GET /api/v1/supplier/reportDetailByPeriod
   */
  async getSalesReport(dateFrom: string, dateTo: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/api/v1/supplier/reportDetailByPeriod', {
        params: {
          dateFrom, // Format: YYYY-MM-DD
          dateTo,
          limit: 100000,
          rrdid: 0
        }
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching WB sales report:', error);
      return [];
    }
  }

  /**
   * Sync product price from WB to our database
   */
  async syncProductPrice(nmId: number): Promise<number | null> {
    try {
      const prices = await this.getPrices([nmId]);
      return prices.get(nmId) || null;
    } catch (error) {
      console.error(`Error syncing WB price for ${nmId}:`, error);
      return null;
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.token;
  }
}

export default new WildberriesService();
