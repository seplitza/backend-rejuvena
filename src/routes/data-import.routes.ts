import express, { Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import Order from '../models/Order.model';
import Payment from '../models/Payment.model';
import User from '../models/User.model';
import mongoose from 'mongoose';

const router = express.Router();

// Multer для загрузки файлов (хранить в памяти)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

/**
 * Универсальный парсер для различных форматов данных
 */
class DataImportParser {
  
  /**
   * Парс CSV с авто-детекцией разделителя
   */
  static parseCSV(content: string): any[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Определяем разделитель (;, ,, \t)
    const separators = [';', ',', '\t'];
    let separator = ';';
    
    for (const sep of separators) {
      if (lines[0].includes(sep)) {
        separator = sep;
        break;
      }
    }
    
    const headers = this.parseCSVLine(lines[0], separator);
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = this.parseCSVLine(lines[i], separator);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      data.push(row);
    }
    
    return data;
  }
  
  /**
   * Парс одной строки CSV с учетом кавычек
   */
  static parseCSVLine(line: string, separator: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    return values.map(v => v.replace(/^"|"$/g, ''));
  }
  
  /**
   * Парс JSON файла
   */
  static parseJSON(content: string): any[] {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  
  /**
   * Авто-детекция типа данных (заказы, платежи, пользователи)
   */
  static detectDataType(data: any[]): 'orders' | 'payments' | 'users' | 'unknown' {
    if (data.length === 0) return 'unknown';
    
    const sample = data[0];
    const keys = Object.keys(sample).map(k => k.toLowerCase());
    
    // Признаки заказа
    if (keys.includes('orderNumber'.toLowerCase()) || 
        keys.includes('items') ||
        keys.includes('товары в заказе')) {
      return 'orders';
    }
    
    // Признаки платежа
    if (keys.includes('amount') || 
        keys.includes('сумма') ||
        keys.includes('payment')) {
      return 'payments';
    }
    
    // Признаки пользователя
    if (keys.includes('email') || 
        keys.includes('phone') ||
        keys.includes('firstName'.toLowerCase())) {
      return 'users';
    }
    
    return 'unknown';
  }
  
  /**
   * Нормализация названий полей (маппинг на стандартные поля)
   */
  static normalizeFields(data: any[], type: string): any[] {
    const fieldMappings: Record<string, Record<string, string>> = {
      orders: {
        'Порядковый номер': 'orderNumber',
        'ФИО': 'fullName',
        'Email': 'email',
        'Phone': 'phone',
        'Date': 'date',
        'Сумма заказа': 'totalAmount',
        'Статус оплаты': 'paymentStatus',
        'Товары в заказе': 'items',
        'Адрес доставки': 'deliveryAddress',
        'Способ оплаты': 'paymentMethod',
        'Промокод': 'promoCode',
        'Скидка': 'discount',
        'Дата оплаты': 'paidAt',
        'Трек номер': 'trackNumber',
        'Стоимость доставки': 'shippingCost'
      },
      payments: {
        'Номер заказа': 'orderNumber',
        'Сумма': 'amount',
        'Email': 'email',
        'Статус': 'status'
      },
      users: {
        'Email': 'email',
        'ФИО': 'fullName',
        'Телефон': 'phone',
        'Имя': 'firstName',
        'Фамилия': 'lastName'
      }
    };
    
    const mapping = fieldMappings[type] || {};
    
    return data.map(row => {
      const normalized: any = {};
      
      Object.keys(row).forEach(key => {
        const normalizedKey = mapping[key] || key;
        normalized[normalizedKey] = row[key];
      });
      
      return normalized;
    });
  }
}

/**
 * POST /api/admin/data-import/preview
 * Предпросмотр данных из файла
 */
router.post('/preview', [authMiddleware, adminMiddleware], upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }
    
    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const fileType = filename.endsWith('.json') ? 'json' : 'csv';
    
    // Парсим данные
    let data: any[];
    
    try {
      if (fileType === 'json') {
        data = DataImportParser.parseJSON(content);
      } else {
        data = DataImportParser.parseCSV(content);
      }
    } catch (error: any) {
      return res.status(400).json({ 
        message: 'Ошибка парсинга файла',
        error: error.message 
      });
    }
    
    if (data.length === 0) {
      return res.status(400).json({ message: 'Файл пустой или неверный формат' });
    }
    
    // Детектим тип данных
    const detectedType = DataImportParser.detectDataType(data);
    
    // Нормализуем поля
    const normalizedData = DataImportParser.normalizeFields(data, detectedType);
    
    res.json({
      success: true,
      preview: normalizedData.slice(0, 10), // Первые 10 записей
      totalRecords: data.length,
      detectedType,
      fields: Object.keys(normalizedData[0] || {}),
      fileType,
      filename
    });
    
  } catch (error: any) {
    console.error('Error in preview:', error);
    res.status(500).json({ 
      message: 'Ошибка обработки файла',
      error: error.message 
    });
  }
});

/**
 * POST /api/admin/data-import/execute
 * Выполнить импорт данных
 */
router.post('/execute', [authMiddleware, adminMiddleware], upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }
    
    const { dataType, mode } = req.body; // mode: 'insert' | 'upsert' | 'replace'
    
    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const fileType = filename.endsWith('.json') ? 'json' : 'csv';
    
    // Парсим данные
    let data: any[];
    
    if (fileType === 'json') {
      data = DataImportParser.parseJSON(content);
    } else {
      data = DataImportParser.parseCSV(content);
    }
    
    // Нормализуем
    const normalizedData = DataImportParser.normalizeFields(data, dataType);
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: any[] = [];
    
    // Импортируем в зависимости от типа
    if (dataType === 'orders') {
      // Импорт заказов (используем существующую логику из import-crm-orders)
      for (const orderData of normalizedData) {
        try {
          const orderNumber = `IMPORT-${orderData.orderNumber || Math.random().toString(36).slice(2)}`;
          
          // Проверяем существование
          const existing = await Order.findOne({ orderNumber });
          if (existing && mode === 'insert') {
            skipped++;
            continue;
          }
          
          // Ищем/создаем пользователя
          let user = await User.findOne({ email: orderData.email?.toLowerCase().trim() });
          if (!user) {
            const [firstName, ...lastNameParts] = (orderData.fullName || 'Клиент').split(' ');
            user = new User({
              email: orderData.email?.toLowerCase().trim() || `user${Date.now()}@import.local`,
              firstName: firstName || 'Клиент',
              lastName: lastNameParts.join(' ') || '',
              phone: orderData.phone,
              password: Math.random().toString(36).slice(-8),
              role: 'customer'
            });
            await user.save();
          }
          
          // Парсим товары
          const items = [{
            productId: new mongoose.Types.ObjectId(),
            productName: orderData.items || 'Импортированный товар',
            quantity: 1,
            price: parseFloat(orderData.totalAmount?.replace(/,/g, '') || '0') * 100
          }];
          
          const totalAmount = parseFloat(orderData.totalAmount?.replace(/,/g, '') || '0') * 100;
          const discount = parseFloat(orderData.discount?.replace(/,/g, '') || '0') * 100;
          const shippingCost = parseFloat(orderData.shippingCost?.replace(/,/g, '') || '0') * 100;
          
          const orderDoc = {
            orderNumber,
            userId: user._id,
            items,
            shippingAddress: {
              fullName: orderData.fullName || 'Не указано',
              phone: orderData.phone || '',
              address: orderData.deliveryAddress || 'Не указан',
              city: 'Не указан',
              postalCode: '',
              country: 'Россия'
            },
            subtotal: totalAmount,
            shippingCost,
            discount,
            total: totalAmount,
            status: orderData.paymentStatus === 'оплачено' ? 'delivered' : 'pending',
            paymentStatus: orderData.paymentStatus === 'оплачено' ? 'paid' : 'pending',
            paymentMethod: 'online',
            shippingMethod: 'cdek_pickup',
            notes: `Импортировано из ${filename}`,
            createdAt: orderData.date ? new Date(orderData.date) : new Date()
          };
          
          if (mode === 'upsert' && existing) {
            await Order.updateOne({ _id: existing._id }, orderDoc);
          } else {
            await Order.create(orderDoc);
          }
          
          imported++;
        } catch (error: any) {
          errors++;
          errorDetails.push({ row: orderData, error: error.message });
        }
      }
    }
    
    res.json({
      success: true,
      imported,
      skipped,
      errors,
      errorDetails: errorDetails.slice(0, 10), // Первые 10 ошибок
      totalProcessed: normalizedData.length
    });
    
  } catch (error: any) {
    console.error('Error in execute:', error);
    res.status(500).json({ 
      message: 'Ошибка импорта',
      error: error.message 
    });
  }
});

/**
 * GET /api/admin/data-import/history
 * История импортов
 */
router.get('/history', [authMiddleware, adminMiddleware], async (req: Request, res: Response) => {
  try {
    // Находим все импортированные заказы
    const importedOrders = await Order.find({
      orderNumber: /^(CRM-|IMPORT-)/
    }).sort({ createdAt: -1 }).limit(100);
    
    const stats = {
      totalImportedOrders: importedOrders.length,
      crmOrders: await Order.countDocuments({ orderNumber: /^CRM-/ }),
      customImports: await Order.countDocuments({ orderNumber: /^IMPORT-/ })
    };
    
    res.json({
      success: true,
      imports: importedOrders,
      stats
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
