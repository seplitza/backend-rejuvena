"use strict";
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
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv_1.default.config();
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// Базовый курс "Look Younger"
const MARATHON_ID = '8ae4db8b-b256-462a-8918-7e7811243d64';
async function fetchLookYoungerCourse() {
    try {
        console.log('📡 Запрашиваем список дней курса "Look Younger"...\n');
        // Сначала получим список марафонов, чтобы узнать структуру дней
        const marathonsResponse = await axios_1.default.get(`${OLD_API_URL}/usermarathon/startmarathons`, {
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': 'en'
            }
        });
        const lookYounger = marathonsResponse.data.find((m) => m.id === MARATHON_ID);
        if (!lookYounger) {
            console.log('❌ Курс "Look Younger" не найден');
            return;
        }
        console.log(`✅ Курс найден: ${lookYounger.title}`);
        console.log(`   Дней: ${lookYounger.marathonDaysCount || '?'}`);
        console.log(`   Описание: ${lookYounger.description || 'Нет'}\n`);
        // Получаем данные первого дня (обычно Day 1 содержит все упражнения)
        // Нужно получить dayId - попробуем запросить с разными параметрами
        console.log('📡 Запрашиваем Day 1...\n');
        // Попробуем получить данные марафона
        const enrollResponse = await axios_1.default.post(`${OLD_API_URL}/usermarathon/enrollmarathon`, {
            marathonId: MARATHON_ID,
            timeZoneOffset: -180
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': 'en'
            }
        });
        console.log('✅ Данные марафона получены\n');
        // Пытаемся найти первый день
        const marathonDays = enrollResponse.data.marathonDays || [];
        if (marathonDays.length === 0) {
            console.log('⚠️  Дни не найдены в данных марафона');
            console.log('💡 Попробуйте получить JSON через консоль браузера:');
            console.log('   1. Откройте https://seplitza.github.io/Rejuvena_old_app/courses');
            console.log('   2. Выберите курс "Look Younger"');
            console.log('   3. Откройте DevTools → Network → найдите запрос getdayexercise');
            console.log('   4. Скопируйте Response и отправьте мне\n');
            return;
        }
        const firstDay = marathonDays[0];
        console.log(`✅ Первый день: ${firstDay.title || 'Day 1'}`);
        console.log(`   dayId: ${firstDay.id}\n`);
        // Теперь получаем упражнения первого дня
        const dayResponse = await axios_1.default.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
            params: {
                marathonId: MARATHON_ID,
                dayId: firstDay.id,
                timeZoneOffset: -180
            },
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': 'en'
            }
        });
        const dayData = dayResponse.data;
        const categories = dayData.marathonDay?.dayCategories || [];
        console.log(`📦 Получено категорий: ${categories.length}\n`);
        let totalExercises = 0;
        categories.forEach((cat) => {
            console.log(`   📂 ${cat.categoryName}: ${cat.exercises?.length || 0} упражнений`);
            totalExercises += cat.exercises?.length || 0;
        });
        console.log(`\n📊 Всего упражнений: ${totalExercises}\n`);
        // Сохраняем в JSON
        const outputPath = './look-younger-day1-data.json';
        fs.writeFileSync(outputPath, JSON.stringify(dayData, null, 2));
        console.log(`💾 Данные сохранены в: ${outputPath}\n`);
        console.log('✅ Готово! Теперь можно импортировать упражнения.');
    }
    catch (error) {
        console.error('❌ Ошибка:', error.message);
        if (error.response) {
            console.error('Статус:', error.response.status);
            console.error('Данные:', JSON.stringify(error.response.data, null, 2));
        }
    }
}
fetchLookYoungerCourse();
