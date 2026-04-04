"use strict";
/**
 * CDEK Service - Shipping integration
 * Delivery cost calculation, office search, order creation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDEKService = void 0;
const axios_1 = __importDefault(require("axios"));
class CDEKService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        // CDEK API credentials (get from env)
        this.apiUrl = process.env.CDEK_API_URL || 'https://api.cdek.ru/v2';
        this.clientId = process.env.CDEK_CLIENT_ID || '';
        this.clientSecret = process.env.CDEK_CLIENT_SECRET || '';
    }
    /**
     * Get OAuth access token
     */
    async getAccessToken() {
        // Check if token is still valid
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.accessToken;
        }
        try {
            const response = await axios_1.default.post(`${this.apiUrl}/oauth/token`, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            this.accessToken = response.data.access_token;
            // Set expiry (usually 1 hour, subtract 5 min for safety)
            this.tokenExpiry = new Date();
            this.tokenExpiry.setSeconds(this.tokenExpiry.getSeconds() + response.data.expires_in - 300);
            if (!this.accessToken) {
                throw new Error('CDEK returned empty access token');
            }
            return this.accessToken;
        }
        catch (error) {
            console.error('Error getting CDEK access token:', error);
            throw new Error('Failed to authenticate with CDEK');
        }
    }
    /**
     * Search CDEK pickup offices by city
     */
    async searchOffices(city, limit = 20) {
        try {
            const token = await this.getAccessToken();
            const response = await axios_1.default.get(`${this.apiUrl}/deliverypoints`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    city,
                    type: 'PVZ', // Pickup point
                    have_cashless: true, // Accepts card payments
                    is_dressing_room: false,
                    limit
                }
            });
            return response.data.map((office) => ({
                code: office.code,
                name: office.name,
                address: `${office.location.address_full}`,
                city: office.location.city,
                phone: office.phones?.[0]?.number || '',
                workTime: office.work_time || '',
                location: {
                    latitude: office.location.latitude,
                    longitude: office.location.longitude
                }
            }));
        }
        catch (error) {
            console.error('Error searching CDEK offices:', error);
            return [];
        }
    }
    /**
     * Calculate delivery cost
     */
    async calculateDelivery(params) {
        try {
            const token = await this.getAccessToken();
            const response = await axios_1.default.post(`${this.apiUrl}/calculator/tariff`, {
                type: 1, // Delivery to door
                from_location: {
                    postal_code: params.fromPostalCode
                },
                to_location: {
                    postal_code: params.toPostalCode
                },
                packages: [
                    {
                        weight: params.weight,
                        length: params.length,
                        width: params.width,
                        height: params.height
                    }
                ],
                services: [
                    {
                        code: 'INSURANCE', // Insurance
                        parameter: params.declaredValue
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.total_sum) {
                return {
                    price: Math.round(response.data.total_sum),
                    estimatedDays: response.data.period_max || 7,
                    services: response.data.services?.map((s) => s.code) || []
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error calculating CDEK delivery:', error);
            return null;
        }
    }
    /**
     * Create CDEK order
     */
    async createOrder(params) {
        try {
            const token = await this.getAccessToken();
            const requestBody = {
                type: params.officeCode ? 1 : 2, // 1 = warehouse-warehouse, 2 = warehouse-door
                number: params.orderNumber,
                tariff_code: params.officeCode ? 136 : 137, // PVZ or courier
                recipient: {
                    name: params.recipientName,
                    phones: [{ number: params.recipientPhone }]
                },
                packages: params.packages.map(pkg => ({
                    number: '1',
                    weight: pkg.weight,
                    length: pkg.length,
                    width: pkg.width,
                    height: pkg.height,
                    items: pkg.items.map(item => ({
                        name: item.name,
                        ware_key: item.sku,
                        payment: {
                            value: params.paymentMethod === 'prepaid' ? 0 : item.price * item.quantity
                        },
                        cost: item.price,
                        weight: item.weight,
                        amount: item.quantity
                    }))
                }))
            };
            // Add delivery point or address
            if (params.officeCode) {
                requestBody.to_location = {
                    code: params.officeCode
                };
            }
            else if (params.deliveryAddress) {
                requestBody.to_location = {
                    city: params.deliveryAddress.city,
                    address: `${params.deliveryAddress.street}, ${params.deliveryAddress.house}${params.deliveryAddress.flat ? `, кв. ${params.deliveryAddress.flat}` : ''}`
                };
            }
            if (params.recipientEmail) {
                requestBody.recipient.email = params.recipientEmail;
            }
            const response = await axios_1.default.post(`${this.apiUrl}/orders`, requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.entity?.uuid) {
                return {
                    orderId: response.data.entity.uuid,
                    barcode: response.data.entity.cdek_number || ''
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error creating CDEK order:', error.response?.data || error);
            return null;
        }
    }
    /**
     * Track order status
     */
    async trackOrder(cdekOrderId) {
        try {
            const token = await this.getAccessToken();
            const response = await axios_1.default.get(`${this.apiUrl}/orders/${cdekOrderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return {
                status: response.data.entity?.status,
                statusCode: response.data.entity?.status_code,
                statusDescription: response.data.entity?.status_description,
                trackingNumber: response.data.entity?.cdek_number,
                deliveryDate: response.data.entity?.delivery_date
            };
        }
        catch (error) {
            console.error('Error tracking CDEK order:', error);
            return null;
        }
    }
    /**
     * Get default warehouse postal code from env
     */
    getWarehousePostalCode() {
        return process.env.CDEK_WAREHOUSE_POSTAL_CODE || '105064'; // Moscow default
    }
}
exports.CDEKService = CDEKService;
exports.default = new CDEKService();
