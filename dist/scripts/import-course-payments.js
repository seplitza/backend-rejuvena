"use strict";
/**
 * Импорт покупок курсов из CSV файла (экспорт из старой CRM)
 * Создает Payment записи для онлайн курсов (не товаров из магазина)
 *
 * Запуск: npx ts-node src/scripts/import-course-payments.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Payment_model_1 = __importDefault(require("../models/Payment.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
// Подключение к MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
// Путь к CSV файлу с покупками
const CSV_PATH = path_1.default.join(__dirname, '../../', 'leads-d38fdafa67d3fb1ea77d6191bd3a5d815fcb42c1f741e4f5c431f65069d996bf.csv');
/**
 * Парсинг CSV файла
 */
function parseCSV(filepath) {
    const content = fs_1.default.readFileSync(filepath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length === 0) {
        return [];
    }
    // Первая строка - заголовки (разделитель ;)
    const headers = lines[0].split(';').map(h => h.replace(/^"|"$/g, '').trim());
    console.log(`📋 Найдено столбцов: ${headers.length}`);
    console.log(`📋 Первые заголовки:`, headers.slice(0, 15).join(', '));
    const payments = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim())
            continue;
        // Парсинг с учетом кавычек и точек с запятой
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            }
            else if (char === ';' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            }
            else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Последнее значение
        // Поиск индексов нужных столбцов
        const orderNumberIdx = headers.findIndex(h => h.includes('Порядковый номер'));
        const fullNameIdx = headers.findIndex(h => h.toLowerCase().includes('фио'));
        const dateIdx = headers.findIndex(h => h === 'Date');
        const amountIdx = headers.findIndex(h => h === 'Сумма заказа');
        const statusIdx = headers.findIndex(h => h === 'Статус оплаты');
        const phoneIdx = headers.findIndex(h => h === 'Phone');
        const itemsIdx = headers.findIndex(h => h.includes('Товары в заказе'));
        const emailIdx = headers.findIndex(h => h === 'Email');
        const email2Idx = headers.findIndex(h => h.includes('емейл_из_формы'));
        const deliveryIdx = headers.findIndex(h => h === 'Адрес доставки');
        const trackIdx = headers.findIndex(h => h.includes('Трек номер'));
        const paymentMethodIdx = headers.findIndex(h => h === 'Способ оплаты');
        const paidAtIdx = headers.findIndex(h => h === 'Дата оплаты');
        const orderNumber = values[orderNumberIdx]?.trim();
        const fullName = values[fullNameIdx]?.trim() || 'Клиент';
        const email = values[emailIdx]?.trim() || values[email2Idx]?.trim();
        const date = values[dateIdx]?.trim();
        const amount = values[amountIdx]?.trim();
        const paymentStatus = values[statusIdx]?.trim();
        const phone = values[phoneIdx]?.trim();
        const items = values[itemsIdx]?.trim();
        const deliveryAddress = values[deliveryIdx]?.trim();
        const cdekTracking = values[trackIdx]?.trim();
        const paymentMethod = values[paymentMethodIdx]?.trim() || 'yamoney';
        const paidAt = values[paidAtIdx]?.trim() || date;
        if (!orderNumber || !email || !amount) {
            console.log(`⚠️  Пропуск строки ${i}: orderNumber='${orderNumber}', email='${email}', amount='${amount}'`);
            continue;
        }
        payments.push({
            orderNumber,
            fullName,
            email,
            date,
            amount,
            paymentStatus,
            phone,
            items,
            paymentMethod,
            paidAt,
            deliveryAddress,
            cdekTracking
        });
    }
    return payments;
}
/**
 * Проверка, является ли заказ покупкой курса (а не товара)
 * Курсы обычно не имеют CDEK трека и пункта выдачи
 */
function isCoursePayment(payment) {
    const items = payment.items.toLowerCase();
    // Признаки курса/онлайн услуги
    const courseKeywords = [
        'курс',
        'консультация',
        'марафон',
        'тренинг',
        'вебинар',
        'обучение',
        'доступ',
        'подписка',
        'premium',
        'омолодись'
    ];
    // Если есть CDEK трек или пункт выдачи - это магазинный заказ
    if (payment.cdekTracking || (payment.deliveryAddress && payment.deliveryAddress.includes('Пункт выдачи'))) {
        return false;
    }
    // Проверяем наличие ключевых слов курсов
    return courseKeywords.some(keyword => items.includes(keyword));
}
/**
 * Парсинг названия курса из строки товаров
 */
function parseCourseName(itemsStr) {
    // Извлекаем название до "x 1"
    const match = itemsStr.match(/^(.+?)\s+x\s+\d+/);
    if (match) {
        return match[1].trim().replace(/\(.*?\)/g, '').trim();
    }
    return itemsStr.substring(0, 100);
}
/**
 * Парсинг статуса оплаты
 */
function parsePaymentStatus(status) {
    const normalized = status.toLowerCase().trim();
    if (normalized === 'оплачено' || normalized === 'оплачена')
        return 'succeeded';
    if (normalized === 'еще не прошла' || normalized === 'не оплачено')
        return 'pending';
    return 'processing';
}
/**
 * Парсинг способа оплаты
 */
function parsePaymentMethod(method) {
    const normalized = method.toLowerCase();
    if (normalized.includes('yamoney') || normalized.includes('yoomoney') || normalized.includes('юmoney'))
        return 'card';
    if (normalized.includes('card') || normalized.includes('карт'))
        return 'card';
    if (normalized.includes('sbp') || normalized.includes('сбп'))
        return 'sbp';
    return 'unknown';
}
/**
 * Главная функция импорта
 */
async function importCoursePayments() {
    try {
        console.log('🔌 Подключение к MongoDB...');
        await mongoose_1.default.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB\n');
        // Парсим CSV
        console.log(`📂 Чтение файла: ${CSV_PATH}\n`);
        const allPayments = parseCSV(CSV_PATH);
        console.log(`📋 Всего записей в CSV: ${allPayments.length}\n`);
        // Фильтруем только покупки курсов
        const coursePayments = allPayments.filter(isCoursePayment);
        console.log(`🎓 Найдено покупок курсов: ${coursePayments.length}\n`);
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        for (const payment of coursePayments) {
            try {
                // Проверяем, не импортирован ли уже
                const existingPayment = await Payment_model_1.default.findOne({
                    orderNumber: `CRM-COURSE-${payment.orderNumber}`
                });
                if (existingPayment) {
                    console.log(`⏭️  Платеж #${payment.orderNumber} уже существует`);
                    skipped++;
                    continue;
                }
                // Ищем или создаем пользователя
                const emailNormalized = payment.email.toLowerCase().trim();
                let user = await User_model_1.default.findOne({ email: emailNormalized });
                if (!user) {
                    // Создаем нового пользователя
                    const [firstName, ...lastNameParts] = payment.fullName.split(' ');
                    user = new User_model_1.default({
                        email: emailNormalized,
                        firstName: firstName || 'Клиент',
                        lastName: lastNameParts.join(' ') || '',
                        phone: payment.phone,
                        password: Math.random().toString(36).slice(-8), // Временный пароль
                        role: 'customer'
                    });
                    await user.save();
                    console.log(`👤 Создан пользователь: ${user.email}`);
                }
                // Парсим сумму и конвертируем в копейки для согласованности с Payment моделью
                const amountInRubles = parseFloat(payment.amount.replace(/,/g, '')) || 0;
                const amount = amountInRubles * 100; // Конвертация в копейки
                // Определяем статус
                const status = parsePaymentStatus(payment.paymentStatus);
                const courseName = parseCourseName(payment.items);
                // Создаем платеж
                const newPayment = new Payment_model_1.default({
                    userId: user._id,
                    orderNumber: `CRM-COURSE-${payment.orderNumber}`,
                    amount,
                    currency: '643', // RUB
                    status,
                    paymentMethod: parsePaymentMethod(payment.paymentMethod),
                    description: `${courseName} (из старой CRM)`,
                    metadata: {
                        type: 'course',
                        courseName,
                        importedFrom: 'old-crm',
                        originalOrderNumber: payment.orderNumber,
                        items: payment.items
                    },
                    createdAt: new Date(payment.date),
                    updatedAt: payment.paidAt ? new Date(payment.paidAt) : new Date(payment.date)
                });
                await newPayment.save();
                imported++;
                console.log(`✅ Импортирован платеж #${payment.orderNumber}: ${courseName} - ${amount}₽ (${payment.email})`);
            }
            catch (error) {
                console.error(`❌ Ошибка при импорте платежа #${payment.orderNumber}:`, error.message);
                errors++;
            }
        }
        console.log('\n📊 Результаты импорта:');
        console.log(`✅ Импортировано: ${imported}`);
        console.log(`⏭️  Пропущено: ${skipped}`);
        console.log(`❌ Ошибок: ${errors}`);
        console.log(`📦 Всего обработано: ${coursePayments.length}`);
    }
    catch (error) {
        console.error('❌ Критическая ошибка:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    }
}
// Запуск импорта
importCoursePayments();
