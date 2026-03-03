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
   * Правильно обрабатывает многострочные поля в кавычках
   */
  static parseCSV(content: string): any[] {
    // Определяем разделитель (;, ,, \t)
    const separators = [';', ',', '\t'];
    let separator = ';';
    
    const firstLine = content.split('\n')[0];
    for (const sep of separators) {
      if (firstLine.includes(sep)) {
        separator = sep;
        break;
      }
    }
    
    // Разбиваем на строки с учетом кавычек
    const rows = this.splitCSVRows(content);
    if (rows.length < 2) return [];
    
    const headers = this.parseCSVLine(rows[0], separator);
    const data: any[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      
      const values = this.parseCSVLine(rows[i], separator);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      
      data.push(row);
    }
    
    return data;
  }
  
  /**
   * Разбивает CSV на строки с учетом многострочных полей в кавычках
   */
  static splitCSVRows(content: string): string[] {
    const rows: string[] = [];
    let currentRow = '';
    let inQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];
      
      if (char === '"') {
        // Проверяем на escaped кавычку ""
        if (nextChar === '"') {
          currentRow += '""';
          i++; // Пропускаем следующую кавычку
        } else {
          inQuotes = !inQuotes;
          currentRow += char;
        }
      } else if (char === '\n' && !inQuotes) {
        // Конец строки (только если не внутри кавычек)
        if (currentRow.trim()) {
          rows.push(currentRow);
        }
        currentRow = '';
      } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
        // Windows line ending
        if (currentRow.trim()) {
          rows.push(currentRow);
        }
        currentRow = '';
        i++; // Пропускаем \n
      } else {
        currentRow += char;
      }
    }
    
    // Добавляем последнюю строку
    if (currentRow.trim()) {
      rows.push(currentRow);
    }
    
    return rows;
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
      const nextChar = line[i + 1];
      
      if (char === '"') {
        // Проверяем на escaped кавычку ""
        if (nextChar === '"' && inQuotes) {
          current += '"';
          i++; // Пропускаем следующую кавычку
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    return values.map(v => v.trim());
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
  static normalizeFields(data: any[], type: string, userMapping: Record<string, string> = {}): any[] {
    const fieldMappings: Record<string, Record<string, string>> = {
      orders: {
        'Порядковый номер': 'orderNumber',
        'ФИО': 'fullName',
        'Имя': 'firstName',
        'Фамилия': 'lastName',
        'Email': 'email',
        'Phone': 'phone',
        'Телефон': 'phone',
        'Date': 'date',
        'Дата': 'date',
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
        // Сначала проверяем пользовательский маппинг
        let normalizedKey = userMapping[key];
        
        // Если нет пользовательского маппинга, используем автоматический
        if (!normalizedKey) {
          normalizedKey = mapping[key] || key;
        }
        
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
    const normalizedData = DataImportParser.normalizeFields(data, detectedType, {});
    
    res.json({
      success: true,
      data: {
        preview: normalizedData.slice(0, 10), // Первые 10 записей
        totalRecords: data.length,
        detectedType,
        fields: Object.keys(normalizedData[0] || {}),
        fileType,
        filename
      }
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
    
    const { dataType, mode, columnMapping, selectedColumns } = req.body; // mode: 'insert' | 'upsert' | 'replace'
    const mapping = columnMapping ? JSON.parse(columnMapping) : {};
    const selected = selectedColumns ? JSON.parse(selectedColumns) : [];
    
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
    
    // Нормализуем с учетом пользовательского маппинга
    const normalizedData = DataImportParser.normalizeFields(data, dataType, mapping);
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: any[] = [];
    
    // Определяем источник импорта из имени файла
    const importSource = filename.toLowerCase().includes('tilda') || filename.toLowerCase().includes('тильда') 
      ? 'Тильда' 
      : filename.toLowerCase().includes('leads')
        ? 'Тильда'
        : 'Приложение';
    
    // Импортируем в зависимости от типа
    if (dataType === 'users') {
      // Импорт пользователей
      for (const userData of normalizedData) {
        try {
          const userEmail = userData.email?.toLowerCase().trim();
          const userPhone = userData.phone?.trim();
          const hasRealEmail = userEmail && userEmail.length > 0 && !userEmail.includes('@import.local');
          
          // Проверка на наличие email или phone
          if (!hasRealEmail && !userPhone) {
            errors++;
            errorDetails.push({
              row: userData,
              error: 'Отсутствует email или телефон'
            });
            continue;
          }
          
          // Извлекаем ФИО из данных
          let firstName = '';
          let lastName = '';
          
          if (userData.fullName) {
            const nameParts = userData.fullName.trim().split(/\s+/);
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          } else if (userData.firstName || userData.lastName) {
            firstName = userData.firstName?.trim() || '';
            lastName = userData.lastName?.trim() || '';
          }
          
          // Если нет ФИО, пропускаем
          if (!firstName && !lastName) {
            errors++;
            errorDetails.push({
              row: userData,
              error: 'Отсутствует ФИО'
            });
            continue;
          }
          
          // Проверяем существование по email или phone
          let existingUser = null;
          if (hasRealEmail) {
            existingUser = await User.findOne({ email: userEmail });
          }
          if (!existingUser && userPhone) {
            existingUser = await User.findOne({ phone: userPhone });
          }
          
          if (existingUser) {
            if (mode === 'insert') {
              skipped++;
              continue;
            } else if (mode === 'upsert') {
              // Обновляем существующего пользователя, добавляем тег
              const tags = existingUser.tags || [];
              const importTag = `Импортированные (${importSource})`;
              
              let needsUpdate = false;
              if (!tags.includes(importTag)) {
                tags.push(importTag);
                needsUpdate = true;
              }
              if (!tags.includes('Импортированные')) {
                tags.push('Импортированные');
                needsUpdate = true;
              }
              
              if (needsUpdate) {
                await User.updateOne(
                  { _id: existingUser._id },
                  {
                    $set: {
                      firstName: firstName || existingUser.firstName,
                      lastName: lastName || existingUser.lastName,
                      phone: userPhone || existingUser.phone,
                      tags
                    }
                  }
                );
                updated++;
              } else {
                skipped++;
              }
              continue;
            }
          }
          
          // Создаем нового пользователя
          const importTag = `Импортированные (${importSource})`;
          const newUser = new User({
            email: hasRealEmail ? userEmail : `user${Date.now()}_${Math.random().toString(36).slice(2)}@import.local`,
            firstName,
            lastName,
            phone: userPhone,
            password: Math.random().toString(36).slice(-8),
            role: 'customer',
            tags: ['Импортированные', importTag]
          });
          
          await newUser.save();
          imported++;
          
        } catch (error: any) {
          errors++;
          errorDetails.push({ 
            row: userData, 
            error: error.message 
          });
        }
      }
      
    } else if (dataType === 'orders') {
      // Импорт заказов (используем существующую логику из import-crm-orders)
      for (const orderData of normalizedData) {
        try {
          const orderNumber = `IMPORT-${orderData.orderNumber || Math.random().toString(36).slice(2)}`;
          
          // Проверяем существование
          const existing = await Order.findOne({ orderNumber });
          if (existing) {
            if (mode === 'insert') {
              skipped++;
              continue;
            } else if (mode === 'upsert') {
              // Будем обновлять существующий заказ
              // (updated++ будет ниже)
            } else {
              skipped++;
              continue;
            }
          }
          
          // Ищем/создаем пользователя
          const userEmail = orderData.email?.toLowerCase().trim();
          const userPhone = orderData.phone?.trim();
          const hasRealEmail = userEmail && !userEmail.includes('@import.local');
          
          // Проверяем дубликаты по email или phone
          let user = null;
          if (hasRealEmail) {
            user = await User.findOne({ email: userEmail });
          }
          if (!user && userPhone) {
            user = await User.findOne({ phone: userPhone });
          }
          
          if (!user) {
            // Извлекаем ФИО из данных
            let firstName = '';
            let lastName = '';
            
            if (orderData.fullName) {
              const nameParts = orderData.fullName.trim().split(/\s+/);
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            } else if (orderData.firstName || orderData.lastName) {
              firstName = orderData.firstName?.trim() || '';
              lastName = orderData.lastName?.trim() || '';
            }
            
            // Если нет ФИО, пропускаем создание пользователя
            if (!firstName && !lastName) {
              errors++;
              errorDetails.push({
                record: orderNumber,
                error: 'Нет ФИО для создания пользователя'
              });
              continue;
            }
            
            user = new User({
              email: hasRealEmail ? userEmail : `user${Date.now()}_${Math.random().toString(36).slice(2)}@import.local`,
              firstName,
              lastName,
              phone: userPhone,
              password: Math.random().toString(36).slice(-8),
              role: 'customer',
              tags: ['Импортированные', `Импортированные (${importSource})`]
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
          
          // Парсим дату с разными форматами
          let orderDate = new Date();
          if (orderData.date) {
            const dateStr = orderData.date.trim();
            // Пробуем разные форматы: dd.mm.yyyy, dd/mm/yyyy, yyyy-mm-dd, dd-mm-yyyy
            const formats = [
              /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // dd.mm.yyyy
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/mm/yyyy
              /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // yyyy-mm-dd
              /^(\d{1,2})-(\d{1,2})-(\d{4})$/    // dd-mm-yyyy
            ];
            
            for (let i = 0; i < formats.length; i++) {
              const match = dateStr.match(formats[i]);
              if (match) {
                if (i === 0 || i === 1 || i === 3) { // dd.mm.yyyy or dd/mm/yyyy or dd-mm-yyyy
                  orderDate = new Date(`${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`);
                } else { // yyyy-mm-dd
                  orderDate = new Date(dateStr);
                }
                break;
              }
            }
            
            // Если не распарсилось, пробуем стандартный парсер
            if (isNaN(orderDate.getTime())) {
              orderDate = new Date(dateStr);
              if (isNaN(orderDate.getTime())) {
                orderDate = new Date(); // Fallback на текущую дату
              }
            }
          }
          
          const fullName = orderData.fullName || `${user.firstName} ${user.lastName}`.trim() || 'Не указано';
          
          const orderDoc = {
            orderNumber,
            userId: user._id,
            items,
            shippingAddress: {
              fullName,
              phone: orderData.phone?.trim() || user.phone || '',
              address: orderData.deliveryAddress?.trim() || 'Не указан',
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
            notes: `📥 Импортировано из ${filename}`,
            tags: ['импортированные', `импортированные (${importSource})`],
            createdAt: orderDate,
            updatedAt: orderDate
          };
          
          if (mode === 'upsert' && existing) {
            await Order.updateOne({ _id: existing._id }, orderDoc);
            updated++;
          } else if (!existing) {
            await Order.create(orderDoc);
            imported++;
          } else {
            // Не должно попасть сюда, но на всякий случай
            skipped++;
          }
        } catch (error: any) {
          errors++;
          errorDetails.push({ row: orderData, error: error.message });
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        imported,
        updated,
        skipped,
        errors,
        errorDetails, // Все ошибки, не ограничено
        totalProcessed: normalizedData.length,
        importSource
      }
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
      data: {
        history: importedOrders,
        stats
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
