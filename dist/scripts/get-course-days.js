"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
// ⚠️ НАСТРОЙТЕ marathonId ⚠️
const MARATHON_ID = 'fc62d140-17af-4c61-be90-63a6cc656a7b'; // +Advanced for the Neck
const LANGUAGE = 'en'; // 'en' или 'ru'
/**
 * Получает список всех дней курса с их dayId
 */
async function getCourseDays() {
    try {
        console.log('🔍 Получение списка дней курса\n');
        console.log('='.repeat(80));
        console.log(`Marathon ID: ${MARATHON_ID}`);
        console.log(`Language: ${LANGUAGE}`);
        console.log('='.repeat(80) + '\n');
        // Запускаем марафон (чтобы получить доступ к дням)
        console.log('🚀 Запуск марафона...');
        const startResponse = await axios_1.default.get(`${OLD_API_URL}/usermarathon/startmarathon`, {
            params: {
                marathonId: MARATHON_ID,
                timeZoneOffset: -180
            },
            headers: {
                'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                'UserLanguage': LANGUAGE
            }
        });
        const marathonData = startResponse.data;
        console.log(`✅ Марафон: ${marathonData.title || 'Unknown'}`);
        console.log(`   Описание: ${marathonData.subTitle || 'N/A'}`);
        console.log(`   Всего дней: ${marathonData.marathonDays?.length || 0}\n`);
        if (!marathonData.marathonDays || marathonData.marathonDays.length === 0) {
            console.log('❌ Дни не найдены');
            return;
        }
        console.log('📅 СПИСОК ДНЕЙ:\n');
        console.log('='.repeat(80));
        marathonData.marathonDays.forEach((day, index) => {
            console.log(`\nДень ${index + 1}:`);
            console.log(`  ├─ ID: ${day.dayId || day.id}`);
            console.log(`  ├─ Название: ${day.dayName || 'N/A'}`);
            console.log(`  ├─ Описание: ${day.dayDescription || 'N/A'}`);
            console.log(`  ├─ День #: ${day.day || day.dayNumber || index + 1}`);
            console.log(`  └─ Активен: ${day.isActive !== undefined ? day.isActive : 'N/A'}`);
        });
        console.log('\n' + '='.repeat(80));
        console.log('\n💡 ИСПОЛЬЗОВАНИЕ:');
        console.log('   Скопируйте нужный dayId и используйте его в скрипте импорта:');
        console.log(`   const DAY_ID = '${marathonData.marathonDays[0]?.dayId || marathonData.marathonDays[0]?.id}';\n`);
        // Дополнительно: получаем упражнения первого дня для примера
        const firstDayId = marathonData.marathonDays[0]?.dayId || marathonData.marathonDays[0]?.id;
        if (firstDayId) {
            console.log('='.repeat(80));
            console.log('📋 ПРИМЕР: Категории и упражнения первого дня\n');
            const dayResponse = await axios_1.default.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
                params: {
                    marathonId: MARATHON_ID,
                    dayId: firstDayId,
                    timeZoneOffset: -180
                },
                headers: {
                    'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
                    'UserLanguage': LANGUAGE
                }
            });
            const dayCategories = dayResponse.data.marathonDay?.dayCategories || [];
            console.log(`Найдено категорий: ${dayCategories.length}\n`);
            dayCategories.forEach((cat, index) => {
                console.log(`${index + 1}. 📂 ${cat.categoryName}`);
                console.log(`   Упражнений: ${cat.exercises?.length || 0}`);
                if (cat.exercises?.length > 0) {
                    cat.exercises.slice(0, 3).forEach((ex, i) => {
                        console.log(`   ${i + 1}) ${ex.exerciseName}`);
                    });
                    if (cat.exercises.length > 3) {
                        console.log(`   ... и еще ${cat.exercises.length - 3}`);
                    }
                }
                console.log('');
            });
            console.log('='.repeat(80));
        }
    }
    catch (error) {
        console.error('❌ ОШИБКА:', error.message);
        if (error.response) {
            console.error('📡 Статус:', error.response.status);
            console.error('📡 Данные:', error.response.data);
            console.error('💡 Проверьте:');
            console.error('   - OLD_API_TOKEN в .env файле');
            console.error('   - Правильность MARATHON_ID');
            console.error('   - Доступ к курсу (курс должен быть активирован)');
        }
    }
}
// Запускаем
getCourseDays();
