"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = 'admin@rejuvena.ru';
const TEST_PASSWORD = 'admin123';
async function testPaymentIntegration() {
    try {
        console.log('🧪 Тестирование интеграции с Альфа-Банком\n');
        // 1. Авторизация
        console.log('1️⃣ Авторизация...');
        const loginResponse = await axios_1.default.post(`${API_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        const token = loginResponse.data.token;
        console.log('✅ Авторизация успешна\n');
        // 2. Создание платежа
        console.log('2️⃣ Создание платежа...');
        const createPaymentResponse = await axios_1.default.post(`${API_URL}/api/payment/create`, {
            amount: 990,
            description: 'Тестовый платеж - Премиум подписка на 30 дней',
            planType: 'premium',
            duration: 30
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const payment = createPaymentResponse.data.payment;
        console.log('✅ Платеж создан:');
        console.log(`   ID: ${payment.id}`);
        console.log(`   Order Number: ${payment.orderNumber}`);
        console.log(`   Amount: ${payment.amount} ₽`);
        console.log(`   Payment URL: ${payment.paymentUrl}\n`);
        // 3. Проверка статуса платежа
        console.log('3️⃣ Проверка статуса платежа...');
        const statusResponse = await axios_1.default.get(`${API_URL}/api/payment/status/${payment.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Статус платежа:');
        console.log(`   Status: ${statusResponse.data.payment.status}`);
        console.log(`   Order Number: ${statusResponse.data.payment.orderNumber}`);
        console.log(`   Amount: ${statusResponse.data.payment.amount} ₽\n`);
        // 4. Получение истории платежей
        console.log('4️⃣ Получение истории платежей...');
        const historyResponse = await axios_1.default.get(`${API_URL}/api/payment/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`✅ История платежей (всего: ${historyResponse.data.pagination.total}):`);
        historyResponse.data.payments.forEach((p, index) => {
            console.log(`   ${index + 1}. ${p.description} - ${p.amount} ₽ (${p.status})`);
        });
        console.log('\n✨ Все тесты пройдены успешно!');
        console.log('\n📋 Следующие шаги:');
        console.log('   1. Откройте Payment URL в браузере для тестирования оплаты');
        console.log(`   2. URL: ${payment.paymentUrl}`);
        console.log('   3. Для тестирования используйте тестовые карты Альфа-Банка');
        console.log('   4. После оплаты проверьте статус платежа снова\n');
    }
    catch (error) {
        console.error('\n❌ Ошибка при тестировании:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        else {
            console.error(`   ${error.message}`);
        }
        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n💡 Подсказка: Убедитесь, что сервер запущен (npm run dev)');
        }
    }
}
// Запускаем тест
testPaymentIntegration();
