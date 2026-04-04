"use strict";
/**
 * Wildberries Official API Service
 * Documentation: https://dev.wildberries.ru/
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WildberriesService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class WildberriesService {
    constructor() {
        this.token = process.env.WB_API_TOKEN || '';
        // Инициализация будет выполнена асинхронно
        this.initializeFromDatabase();
        if (!this.token) {
            console.warn('⚠️  WB_API_TOKEN not set in .env - will try to load from database');
        }
        this.apiClient = axios_1.default.create({
            baseURL: 'https://suppliers-api.wildberries.ru',
            headers: {
                'Authorization': this.token,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
    }
    /**
     * Initialize token from database
     */
    async initializeFromDatabase() {
        try {
            // Динамически импортируем модель чтобы избежать circular dependencies
            const Settings = (await Promise.resolve().then(() => __importStar(require('../models/Settings.model')))).default;
            const settings = await Settings.findOne({ key: 'WB_API_TOKEN' });
            if (settings && settings.value) {
                this.updateToken(settings.value);
                console.log('✅ WB_API_TOKEN loaded from database');
            }
        }
        catch (error) {
            console.error('Error loading WB token from database:', error);
        }
    }
    /**
     * Update API token
     */
    updateToken(newToken) {
        this.token = newToken;
        this.apiClient.defaults.headers['Authorization'] = newToken;
        console.log('✅ WB_API_TOKEN updated');
    }
    /**
     * Get product info by article (nmID)
     * API: GET /content/v2/get/cards/list
     */
    async getProductInfo(nmId) {
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
        }
        catch (error) {
            console.error(`Error fetching WB product ${nmId}:`, error);
            return null;
        }
    }
    /**
     * Get current prices for products
     * API: GET /public/api/v1/info
     */
    async getPrices(nmIds) {
        try {
            const response = await this.apiClient.get('/public/api/v1/info', {
                params: {
                    quantity: 0
                }
            });
            const prices = new Map();
            if (response.data) {
                response.data.forEach((item) => {
                    if (nmIds.includes(item.nmID)) {
                        prices.set(item.nmID, item.price);
                    }
                });
            }
            return prices;
        }
        catch (error) {
            console.error('Error fetching WB prices:', error);
            return new Map();
        }
    }
    /**
     * Update product price
     * API: POST /public/api/v1/prices
     */
    async updatePrice(nmId, price) {
        try {
            await this.apiClient.post('/public/api/v1/prices', [{
                    nmId,
                    price
                }]);
            console.log(`✓ Updated WB price for nmID ${nmId}: ${price}₽`);
            return true;
        }
        catch (error) {
            console.error(`Error updating WB price for ${nmId}:`, error);
            return false;
        }
    }
    /**
     * Update multiple prices at once
     */
    async updatePrices(updates) {
        try {
            await this.apiClient.post('/public/api/v1/prices', updates);
            console.log(`✓ Updated ${updates.length} WB prices`);
            return updates.length;
        }
        catch (error) {
            console.error('Error updating WB prices:', error);
            return 0;
        }
    }
    /**
     * Get stocks (warehouse balances)
     * API: GET /api/v3/stocks/{warehouseId}
     */
    async getStocks(warehouseId) {
        try {
            const response = await this.apiClient.get(`/api/v3/stocks/${warehouseId}`);
            return response.data?.stocks || [];
        }
        catch (error) {
            console.error(`Error fetching WB stocks for warehouse ${warehouseId}:`, error);
            return [];
        }
    }
    /**
     * Update stock (warehouse balance)
     * API: PUT /api/v3/stocks/{warehouseId}
     */
    async updateStock(warehouseId, sku, amount) {
        try {
            await this.apiClient.put(`/api/v3/stocks/${warehouseId}`, {
                stocks: [{
                        sku,
                        amount
                    }]
            });
            console.log(`✓ Updated WB stock for SKU ${sku} at warehouse ${warehouseId}: ${amount}`);
            return true;
        }
        catch (error) {
            console.error(`Error updating WB stock:`, error);
            return false;
        }
    }
    /**
     * Get orders (new orders to process)
     * API: GET /api/v3/orders/new
     */
    async getNewOrders(dateFrom) {
        try {
            const response = await this.apiClient.get('/api/v3/orders/new', {
                params: {
                    dateFrom: dateFrom.getTime()
                }
            });
            return response.data?.orders || [];
        }
        catch (error) {
            console.error('Error fetching WB orders:', error);
            return [];
        }
    }
    /**
     * Get sales statistics
     * API: GET /api/v1/supplier/reportDetailByPeriod
     */
    async getSalesReport(dateFrom, dateTo) {
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
        }
        catch (error) {
            console.error('Error fetching WB sales report:', error);
            return [];
        }
    }
    /**
     * Sync product price from WB to our database
     */
    async syncProductPrice(nmId) {
        try {
            const prices = await this.getPrices([nmId]);
            return prices.get(nmId) || null;
        }
        catch (error) {
            console.error(`Error syncing WB price for ${nmId}:`, error);
            return null;
        }
    }
    /**
     * Check if service is properly configured
     */
    isConfigured() {
        return !!this.token;
    }
}
exports.WildberriesService = WildberriesService;
exports.default = new WildberriesService();
