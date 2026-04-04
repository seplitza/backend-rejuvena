"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class AlfaBankService {
    constructor() {
        this.config = {
            username: process.env.ALFABANK_USERNAME || '',
            password: process.env.ALFABANK_PASSWORD || '',
            apiUrl: process.env.ALFABANK_API_URL || 'https://payment.alfabank.ru/payment/rest',
            returnUrl: process.env.ALFABANK_RETURN_URL || 'http://localhost:3000/payment/success',
            failUrl: process.env.ALFABANK_FAIL_URL || 'http://localhost:3000/payment/fail'
        };
        this.client = axios_1.default.create({
            baseURL: this.config.apiUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }
    /**
     * Регистрация заказа в Альфа-Банке
     */
    async registerOrder(params) {
        try {
            const requestData = new URLSearchParams({
                userName: this.config.username,
                password: this.config.password,
                orderNumber: params.orderNumber,
                amount: params.amount.toString(),
                returnUrl: params.returnUrl || this.config.returnUrl,
                failUrl: params.failUrl || this.config.failUrl,
                description: params.description,
                // currency not needed for RUB (default)
                ...(params.email && { email: params.email }), // Email для чека
                ...(params.jsonParams && { jsonParams: JSON.stringify(params.jsonParams) })
            });
            const response = await this.client.post('/register.do', requestData);
            if (response.data.errorCode) {
                throw new Error(`AlfaBank Error ${response.data.errorCode}: ${response.data.errorMessage}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('AlfaBank registerOrder error:', error);
            throw new Error(`Failed to register order: ${error.message}`);
        }
    }
    /**
     * Регистрация заказа с предавторизацией
     */
    async registerPreAuth(params) {
        try {
            const requestData = new URLSearchParams({
                userName: this.config.username,
                password: this.config.password,
                orderNumber: params.orderNumber,
                amount: params.amount.toString(),
                returnUrl: params.returnUrl || this.config.returnUrl,
                failUrl: params.failUrl || this.config.failUrl,
                description: params.description,
                currency: params.currency || '643',
                ...(params.jsonParams && { jsonParams: JSON.stringify(params.jsonParams) })
            });
            const response = await this.client.post('/registerPreAuth.do', requestData);
            if (response.data.errorCode) {
                throw new Error(`AlfaBank Error ${response.data.errorCode}: ${response.data.errorMessage}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('AlfaBank registerPreAuth error:', error);
            throw new Error(`Failed to register pre-auth order: ${error.message}`);
        }
    }
    /**
     * Получение расширенного статуса заказа
     */
    async getOrderStatus(orderId) {
        try {
            const requestData = new URLSearchParams({
                userName: this.config.username,
                password: this.config.password,
                orderId: orderId
            });
            const response = await this.client.post('/getOrderStatusExtended.do', requestData);
            if (response.data.errorCode && response.data.errorCode !== '0') {
                throw new Error(`AlfaBank Error ${response.data.errorCode}: ${response.data.errorMessage}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('AlfaBank getOrderStatus error:', error);
            throw new Error(`Failed to get order status: ${error.message}`);
        }
    }
    /**
     * Отмена/возврат заказа
     */
    async refundOrder(orderId, amount) {
        try {
            const requestData = new URLSearchParams({
                userName: this.config.username,
                password: this.config.password,
                orderId: orderId,
                amount: amount.toString()
            });
            const response = await this.client.post('/refund.do', requestData);
            if (response.data.errorCode && response.data.errorCode !== '0') {
                throw new Error(`AlfaBank Error ${response.data.errorCode}: ${response.data.errorMessage}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('AlfaBank refundOrder error:', error);
            throw new Error(`Failed to refund order: ${error.message}`);
        }
    }
    /**
     * Отмена неоплаченного заказа
     */
    async reverseOrder(orderId) {
        try {
            const requestData = new URLSearchParams({
                userName: this.config.username,
                password: this.config.password,
                orderId: orderId
            });
            const response = await this.client.post('/reverse.do', requestData);
            if (response.data.errorCode && response.data.errorCode !== '0') {
                throw new Error(`AlfaBank Error ${response.data.errorCode}: ${response.data.errorMessage}`);
            }
            return response.data;
        }
        catch (error) {
            console.error('AlfaBank reverseOrder error:', error);
            throw new Error(`Failed to reverse order: ${error.message}`);
        }
    }
    /**
     * Преобразование статуса заказа из кода в строку
     */
    getOrderStatusString(statusCode) {
        const statuses = {
            0: 'pending', // Заказ зарегистрирован, но не оплачен
            1: 'processing', // Предавторизованная сумма захолдирована
            2: 'succeeded', // Проведена полная авторизация суммы заказа
            3: 'cancelled', // Авторизация отменена
            4: 'refunded', // По транзакции была проведена операция возврата
            5: 'processing', // Инициирована авторизация через ACS банка-эмитента
            6: 'failed' // Авторизация отклонена
        };
        return statuses[statusCode] || 'pending';
    }
}
exports.default = new AlfaBankService();
