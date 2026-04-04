"use strict";
/**
 * Импорт заказов из CSV файла (экспорт из старой CRM)
 * Запуск: npx ts-node src/scripts/import-crm-orders.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Order_model_1 = __importDefault(require("../models/Order.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
// Подключение к MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
// Путь к CSV файлу
const CSV_PATH = path_1.default.join(__dirname, '../../', 'leads-d38fdafa67d3fb1ea77d6191bd3a5d815fcb42c1f741e4f5c431f65069d996bf.csv');
/**
 * Парсинг строки товаров из CSV
 * Пример: "Курс "Омолодись" базовый (BLYRu-1, ...) x 1 ≡ 3000"
 */
function parseItems(itemsStr) {
    if (!itemsStr)
        return [];
    const items = [];
    // Разбиваем по переносам строк
    const lines = itemsStr.split('\n');
    for (const line of lines) {
        // Ищем паттерн: "название x количество ≡ цена"
        const match = line.match(/^(.+?)\s+x\s+(\d+)\s+≡\s+([\d,]+)/);
        if (match) {
            const productName = match[1].trim();
            const quantity = parseInt(match[2]);
            const priceInRubles = parseFloat(match[3].replace(/,/g, ''));
            // ВАЖНО: Конвертируем в копейки для согласованности с Payment моделью
            items.push({ productName, quantity, price: priceInRubles * 100 });
        }
    }
    return items;
}
/**
 * Парсинг статуса оплаты из CSV в формат MongoDB
 */
function parsePaymentStatus(status) {
    const normalized = status.toLowerCase().trim();
    if (normalized === 'оплачено' || normalized === 'оплачена')
        return 'paid';
    if (normalized === 'еще не прошла' || normalized === 'не оплачено')
        return 'awaiting_payment';
    if (normalized === 'возврат')
        return 'refunded';
    return 'pending';
}
/**
 * Парсинг способа оплаты
 */
function parsePaymentMethod(method) {
    const normalized = method.toLowerCase().trim();
    if (normalized === 'cash' || normalized === 'наличные')
        return 'cash';
    if (normalized === 'yamoney' || normalized === 'юmoney' || normalized === 'онлайн')
        return 'online';
    if (normalized === 'card' || normalized === 'карта')
        return 'card';
    return 'cash'; // По умолчанию
}
/**
 * Парсинг метода доставки
 */
function parseShippingMethod(service) {
    const normalized = service.toLowerCase().trim();
    if (normalized.includes('сдэк') || normalized.includes('cdek')) {
        if (normalized.includes('пвз') || normalized.includes('пункт выдачи'))
            return 'cdek_pickup';
        if (normalized.includes('постамат'))
            return 'cdek_postamat';
        if (normalized.includes('курьер'))
            return 'cdek_courier';
        return 'cdek';
    }
    if (normalized.includes('курьер'))
        return 'courier';
    if (normalized.includes('самовывоз'))
        return 'pickup';
    return 'cdek_pickup'; // По умолчанию
}
/**
 * Парсинг CSV файла
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const orders = [];
    // Пропускаем заголовок
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        // Парсим CSV с учетом кавычек
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === ';' && !inQuotes) {
                fields.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        fields.push(current.trim());
        // Маппинг полей согласно заголовкам CSV
        const order = {
            orderNumber: fields[0] || '',
            fullName: fields[1] || '',
            date: fields[2] || '',
            totalAmount: fields[3] || '0',
            paymentStatus: fields[4] || '',
            phone: fields[5] || '',
            items: fields[6] || '',
            email: fields[7] || '',
            deliveryAddress: fields[13] || '',
            paymentMethod: fields[23] || 'cash',
            promoCode: fields[25] || '',
            discount: fields[26] || '0',
            paidAt: fields[27] || '',
            shippingService: fields[29] || '',
            trackNumber: fields[30] || '',
            shippingCost: fields[33] || '0'
        };
        if (order.orderNumber && order.email) {
            orders.push(order);
        }
    }
    return orders;
}
/**
 * Основная функция импорта
 */
async function importOrders() {
    try {
        console.log('🔌 Подключение к MongoDB...');
        await mongoose_1.default.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');
        // Читаем CSV файл
        console.log('📖 Чтение CSV файла...');
        const csvContent = fs_1.default.readFileSync(CSV_PATH, 'utf-8');
        const crmOrders = parseCSV(csvContent);
        console.log(`📦 Найдено ${crmOrders.length} заказов в CSV`);
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        for (const crmOrder of crmOrders) {
            try {
                // Проверяем, не импортирован ли уже этот заказ
                const existingOrder = await Order_model_1.default.findOne({ orderNumber: `CRM-${crmOrder.orderNumber}` });
                if (existingOrder) {
                    console.log(`⏭️  Пропускаем заказ #${crmOrder.orderNumber} (уже импортирован)`);
                    skipped++;
                    continue;
                }
                // Ищем или создаем пользователя
                let user = await User_model_1.default.findOne({ email: crmOrder.email.toLowerCase().trim() });
                if (!user) {
                    // Создаем нового пользователя
                    const [firstName, ...lastNameParts] = crmOrder.fullName.split(' ');
                    user = new User_model_1.default({
                        email: crmOrder.email.toLowerCase().trim(),
                        firstName: firstName || 'Клиент',
                        lastName: lastNameParts.join(' ') || '',
                        phone: crmOrder.phone,
                        password: Math.random().toString(36).slice(-8), // Временный пароль
                        role: 'customer'
                    });
                    await user.save();
                    console.log(`👤 Создан пользователь: ${user.email}`);
                }
                // Парсим товары
                const items = parseItems(crmOrder.items);
                if (items.length === 0) {
                    console.log(`⚠️  Заказ #${crmOrder.orderNumber}: нет товаров, пропускаем`);
                    skipped++;
                    continue;
                }
                // Расчет сумм (конвертируем в копейки)
                const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const discount = parseFloat(crmOrder.discount.replace(/,/g, '')) * 100 || 0;
                const shippingCost = parseFloat(crmOrder.shippingCost.replace(/,/g, '')) * 100 || 0;
                const total = parseFloat(crmOrder.totalAmount.replace(/,/g, '')) * 100 || subtotal;
                // Определяем статус заказа
                const paymentStatus = parsePaymentStatus(crmOrder.paymentStatus);
                const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed';
                // Создаем заказ
                const order = new Order_model_1.default({
                    orderNumber: `CRM-${crmOrder.orderNumber}`, // Префикс для отличия от новых заказов
                    userId: user._id,
                    items: items.map(item => ({
                        productId: new mongoose_1.default.Types.ObjectId(), // Заглушка, т.к. товары могут не совпадать
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shippingAddress: {
                        fullName: crmOrder.fullName,
                        phone: crmOrder.phone,
                        address: crmOrder.deliveryAddress || 'Не указан',
                        city: 'Не указан',
                        postalCode: '',
                        country: 'Россия'
                    },
                    subtotal,
                    shippingCost,
                    discount,
                    promoCode: crmOrder.promoCode || undefined,
                    total,
                    status: isPaid ? 'delivered' : 'pending',
                    statusHistory: [
                        {
                            status: 'pending',
                            timestamp: new Date(crmOrder.date),
                            notes: 'Импортировано из старой CRM'
                        }
                    ],
                    paymentStatus,
                    paymentMethod: parsePaymentMethod(crmOrder.paymentMethod),
                    shippingMethod: parseShippingMethod(crmOrder.shippingService),
                    cdekTrackingNumber: crmOrder.trackNumber || undefined,
                    notes: `Импортировано из старой CRM. Оригинальный номер заказа: ${crmOrder.orderNumber}`,
                    createdAt: new Date(crmOrder.date),
                    paidAt: crmOrder.paidAt ? new Date(crmOrder.paidAt) : undefined,
                    deliveredAt: isPaid ? new Date(crmOrder.date) : undefined
                });
                await order.save();
                imported++;
                console.log(`✅ Импортирован заказ #${crmOrder.orderNumber} (${crmOrder.email})`);
            }
            catch (error) {
                console.error(`❌ Ошибка при импорте заказа #${crmOrder.orderNumber}:`, error.message);
                errors++;
            }
        }
        console.log('\n📊 Результаты импорта:');
        console.log(`✅ Импортировано: ${imported}`);
        console.log(`⏭️  Пропущено: ${skipped}`);
        console.log(`❌ Ошибок: ${errors}`);
        console.log(`📦 Всего обработано: ${crmOrders.length}`);
    }
    catch (error) {
        console.error('❌ Критическая ошибка:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Отключено от MongoDB');
    }
}
// Запуск импорта
importOrders();
