import axios, { AxiosInstance } from 'axios';

interface AlfaBankConfig {
  username: string;
  password: string;
  apiUrl: string;
  returnUrl: string;
  failUrl: string;
}

interface RegisterOrderParams {
  orderNumber: string;
  amount: number;
  description: string;
  returnUrl?: string;
  failUrl?: string;
  currency?: string;
  jsonParams?: Record<string, any>;
}

interface RegisterOrderResponse {
  orderId: string;
  formUrl: string;
  errorCode?: string;
  errorMessage?: string;
}

interface OrderStatusResponse {
  orderNumber: string;
  orderStatus: number;
  actionCode?: number;
  actionCodeDescription?: string;
  errorCode?: string;
  errorMessage?: string;
  amount: number;
  currency: string;
  date: number;
  orderDescription?: string;
  ip?: string;
  authRefNum?: string;
  bindingId?: string;
  cardAuthInfo?: {
    pan?: string;
    expiration?: string;
    cardholderName?: string;
    approvalCode?: string;
  };
}

class AlfaBankService {
  private config: AlfaBankConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      username: process.env.ALFABANK_USERNAME || '',
      password: process.env.ALFABANK_PASSWORD || '',
      apiUrl: process.env.ALFABANK_API_URL || 'https://payment.alfabank.ru/payment/rest',
      returnUrl: process.env.ALFABANK_RETURN_URL || 'http://localhost:3000/payment/success',
      failUrl: process.env.ALFABANK_FAIL_URL || 'http://localhost:3000/payment/fail'
    };

    this.client = axios.create({
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
  async registerOrder(params: RegisterOrderParams): Promise<RegisterOrderResponse> {
    try {
      const requestData = new URLSearchParams({
        userName: this.config.username,
        password: this.config.password,
        orderNumber: params.orderNumber,
        amount: params.amount.toString(),
        returnUrl: params.returnUrl || this.config.returnUrl,
        failUrl: params.failUrl || this.config.failUrl,
        description: params.description,
        currency: params.currency || '643', // RUB
        ...(params.jsonParams && { jsonParams: JSON.stringify(params.jsonParams) })
      });

      const response = await this.client.post('/register.do', requestData);

      if (response.data.errorCode) {
        throw new Error(`AlfaBank Error ${response.data.errorCode}: ${response.data.errorMessage}`);
      }

      return response.data as RegisterOrderResponse;
    } catch (error: any) {
      console.error('AlfaBank registerOrder error:', error);
      throw new Error(`Failed to register order: ${error.message}`);
    }
  }

  /**
   * Регистрация заказа с предавторизацией
   */
  async registerPreAuth(params: RegisterOrderParams): Promise<RegisterOrderResponse> {
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

      return response.data as RegisterOrderResponse;
    } catch (error: any) {
      console.error('AlfaBank registerPreAuth error:', error);
      throw new Error(`Failed to register pre-auth order: ${error.message}`);
    }
  }

  /**
   * Получение расширенного статуса заказа
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
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

      return response.data as OrderStatusResponse;
    } catch (error: any) {
      console.error('AlfaBank getOrderStatus error:', error);
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  /**
   * Отмена/возврат заказа
   */
  async refundOrder(orderId: string, amount: number): Promise<any> {
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
    } catch (error: any) {
      console.error('AlfaBank refundOrder error:', error);
      throw new Error(`Failed to refund order: ${error.message}`);
    }
  }

  /**
   * Отмена неоплаченного заказа
   */
  async reverseOrder(orderId: string): Promise<any> {
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
    } catch (error: any) {
      console.error('AlfaBank reverseOrder error:', error);
      throw new Error(`Failed to reverse order: ${error.message}`);
    }
  }

  /**
   * Преобразование статуса заказа из кода в строку
   */
  getOrderStatusString(statusCode: number): string {
    const statuses: Record<number, string> = {
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

export default new AlfaBankService();
