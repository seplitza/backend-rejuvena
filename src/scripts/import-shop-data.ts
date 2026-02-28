import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import Product from '../models/Product.model';
import ProductCategory from '../models/ProductCategory.model';
import Order from '../models/Order.model';
import User from '../models/User.model';

dotenv.config();

const PRODUCTS_CSV = '/Users/alexeipinaev/Downloads/store-1487183-202602261823.csv';
const ORDERS_CSV = '/Users/alexeipinaev/Downloads/leads-fe2d4fae1b25d62d85749e197c1f8e381df18768a4bd1aa077c358304f37d553.csv';
const UPLOAD_DIR = path.join(__dirname, '../../uploads/products');

// Создать директорию для загрузок
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Скачать изображение
async function downloadImage(url: string, productSlug: string, index: number): Promise<string> {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024 // 10MB
    });
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${productSlug}-${index}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    
    fs.writeFileSync(filepath, response.data);
    console.log(`  ✓ Downloaded: ${filename} (${(response.data.length / 1024).toFixed(1)}KB)`);
    
    return `/uploads/products/${filename}`;
  } catch (error: any) {
    console.error(`  ✗ Failed to download ${url}:`, error?.message || error);
    return url; // Вернуть оригинальный URL если не удалось скачать
  }
}

// Парсинг CSV
function parseCSV(filepath: string): any[] {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(';').map(h => h.replace(/^"|"$/g, '').trim());
  
  const data: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Более умный парсинг с учетом кавычек
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ';' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Последнее значение
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

// Генерация slug
function generateSlug(title: string): string {
  const translit: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  
  return title
    .toLowerCase()
    .split('')
    .map(char => translit[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Импорт товаров
async function importProducts() {
  console.log('\n📦 Импорт товаров из Tilda...\n');
  
  const productsData = parseCSV(PRODUCTS_CSV);
  console.log(`Найдено товаров: ${productsData.length}`);
  
  // Создать категорию "Уход за кожей"
  let category = await ProductCategory.findOne({ slug: 'skin-care' });
  if (!category) {
    category = await ProductCategory.create({
      name: 'Уход за кожей',
      slug: 'skin-care',
      description: 'Антивозрастные средства для ухода за кожей',
      icon: '🧴'
    });
    console.log('✓ Создана категория: Уход за кожей');
  }
  
  let imported = 0;
  let skipped = 0;
  
  for (const row of productsData) {
    // Пропустить вариации (editions) - у них есть Parent UID
    if (row['Parent UID']) {
      skipped++;
      continue;
    }
    
    const title = row['Title'];
    const price = parseFloat(row['Price']) || 0;
    const photoUrls = row['Photo']?.split(' ').filter((url: string) => url.startsWith('http')) || [];
    
    // Пропустить записи без нормальных данных
    if (!title || price === 0 || photoUrls.length === 0) {
      console.log(`⊘ Пропущен (нет данных): ${title || 'Unknown'}`);
      skipped++;
      continue;
    }
    
    const slug = row['SKU'] || generateSlug(title);
    
    // Проверить, существует ли товар
    const existing = await Product.findOne({ slug });
    if (existing) {
      console.log(`⊘ Пропущен (существует): ${title}`);
      skipped++;
      continue;
    }
    
    console.log(`\n→ Импорт: ${title}`);
    
    // Загрузить изображения
    const images: string[] = [];
    
    for (let i = 0; i < Math.min(photoUrls.length, 5); i++) {
      const localPath = await downloadImage(photoUrls[i], slug, i);
      if (localPath && localPath !== photoUrls[i]) {
        images.push(localPath);
      }
    }
    
    // Парсинг HTML описания
    const shortDescription = row['Description'] || title;
    const fullDescription = row['Text']?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').substring(0, 2000) || shortDescription;
    
    // Цена
    const compareAtPrice = parseFloat(row['Price Old']) || null;
    
    // Характеристики
    const characteristics: any[] = [];
    if (row['Characteristics:Объём']) {
      characteristics.push({ key: 'Объём', value: row['Characteristics:Объём'] });
    }
    
    // Создать товар
    await Product.create({
      name: title,
      slug,
      description: shortDescription,
      shortDescription,
      fullDescription,
      images,
      price,
      compareAtPrice,
      stock: parseInt(row['Quantity']) || 0,
      sku: row['SKU'] || slug,
      category: category._id,
      characteristics,
      tags: [],
      isActive: true,
      isFeatured: false,
      isBundle: false,
      // Wildberries данные (если есть метка)
      articleWB: row['Mark'] === 'Есть на Wildberries' ? 'WB-' + slug : undefined,
      lastPrice: row['Mark'] === 'Есть на Wildberries' ? price * 0.9 : undefined
    });
    
    console.log(`✓ Импортирован: ${title} (${images.length} фото)`);
    imported++;
  }
  
  console.log(`\n✅ Импорт товаров завершен:`);
  console.log(`   Импортировано: ${imported}`);
  console.log(`   Пропущено: ${skipped}`);
}

// Импорт заказов
async function importOrders() {
  console.log('\n📋 Импорт заказов...\n');
  
  const ordersData = parseCSV(ORDERS_CSV);
  console.log(`Найдено заказов: ${ordersData.length}`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const row of ordersData) {
    const orderNumber = row['Порядковый номер заявки'];
    const email = row['Email'] || row['емейл_из_формы_на_сайте'];
    
    if (!orderNumber || !email) {
      skipped++;
      continue;
    }
    
    // Проверить, существует ли заказ
    const existing = await Order.findOne({ orderNumber: `OLD-${orderNumber}` });
    if (existing) {
      skipped++;
      continue;
    }
    
    // Найти или создать пользователя
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const fullName = row['фио'] || row['имя_в_форме_на_сайте'] || row['Name'] || 'Клиент';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      
      user = await User.create({
        email: email.toLowerCase(),
        password: '$2a$10$' + Math.random().toString(36).substring(7), // Случайный хэш
        firstName: firstName || 'Клиент',
        lastName: lastNameParts.join(' ') || '',
        phone: row['Phone'],
        role: 'customer',
        shopCustomerSince: new Date(row['Date'])
      });
    }
    
    // Парсинг товаров в заказе
    const itemsText = row['Товары в заказе'] || '';
    const items: any[] = [];
    
    // Формат: "NMN (NMN) x 1 ≡ 2400\nТонер x 1 ≡ 980"
    const itemLines = itemsText.split('\n').filter(Boolean);
    for (const line of itemLines) {
      const match = line.match(/(.+?)\s+x\s+(\d+)\s+≡\s+([\d,]+)/);
      if (match) {
        const [, productName, quantity, priceStr] = match;
        const price = parseFloat(priceStr.replace(',', '.'));
        
        items.push({
          productId: null, // Не можем связать со старыми товарами
          productName: productName.trim(),
          quantity: parseInt(quantity),
          price,
          total: price
        });
      }
    }
    
    const total = parseFloat(row['Сумма заказа']) || 0;
    const date = new Date(row['Date'] || row['Дата оплаты']);
    
    // Маппинг статусов
    const paymentStatus = row['Статус оплаты'] === 'еще не прошла' ? 'pending' : 'paid';
    const status = paymentStatus === 'paid' ? 'processing' : 'pending';
    
    await Order.create({
      orderNumber: `OLD-${orderNumber}`,
      userId: user._id,
      customerEmail: email,
      customerName: row['фио'] || row['Name'] || 'Клиент',
      customerPhone: row['Phone'],
      items,
      subtotal: total,
      shippingCost: 0,
      discount: 0,
      total,
      status,
      paymentStatus,
      shippingAddress: row['Адрес доставки'] || '',
      notes: row['Последний комментарий'],
      createdAt: date,
      updatedAt: date
    });
    
    console.log(`✓ Импортирован заказ #${orderNumber} (${email})`);
    imported++;
  }
  
  console.log(`\n✅ Импорт заказов завершен:`);
  console.log(`   Импортировано: ${imported}`);
  console.log(`   Пропущено: ${skipped}`);
}

// Главная функция
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/rejuvena');
    console.log('✓ Connected to MongoDB');
    
    await importProducts();
    await importOrders();
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    console.log('\n🎉 Импорт завершен успешно!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n✗ Error:', error?.message || error);
    process.exit(1);
  }
}

main();
