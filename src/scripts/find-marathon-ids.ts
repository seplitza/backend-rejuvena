import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';

/**
 * Скрипт для поиска marathonId и dayId в старом приложении
 * Использует API старого приложения для получения списка курсов
 */
async function findMarathonIds() {
  try {
    console.log('🔍 Поиск курсов (марафонов) в OLD APP\n');
    console.log('='.repeat(80) + '\n');

    // Получаем список марафонов для РУССКОГО языка
    console.log('📝 РУССКИЕ КУРСЫ (RU):');
    console.log('-'.repeat(80));
    const ruResponse = await axios.get(`${OLD_API_URL}/usermarathon/startmarathons`, {
      headers: {
        'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
        'UserLanguage': 'ru'
      }
    });

    const ruMarathons = ruResponse.data.marathons || [];
    console.log(`Найдено курсов: ${ruMarathons.length}\n`);

    ruMarathons.forEach((marathon: any, index: number) => {
      console.log(`${index + 1}. 📚 ${marathon.marathonName || 'Без названия'}`);
      console.log(`   ID: ${marathon.marathonId}`);
      console.log(`   Описание: ${marathon.marathonDescription?.substring(0, 100) || 'Нет описания'}...`);
      console.log(`   Дней: ${marathon.marathonDays || 0}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // Получаем список марафонов для АНГЛИЙСКОГО языка  
    console.log('📝 АНГЛИЙСКИЕ КУРСЫ (EN):');
    console.log('-'.repeat(80));
    const enResponse = await axios.get(`${OLD_API_URL}/usermarathon/startmarathons`, {
      headers: {
        'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
        'UserLanguage': 'en'
      }
    });

    const enMarathons = enResponse.data.marathons || [];
    console.log(`Найдено курсов: ${enMarathons.length}\n`);

    enMarathons.forEach((marathon: any, index: number) => {
      console.log(`${index + 1}. 📚 ${marathon.marathonName || 'Без названия'}`);
      console.log(`   ID: ${marathon.marathonId}`);
      console.log(`   Описание: ${marathon.marathonDescription?.substring(0, 100) || 'Нет описания'}...`);
      console.log(`   Дней: ${marathon.marathonDays || 0}`);
      console.log('');
    });

    console.log('\n' + '='.repeat(80));
    console.log('💡 ИНСТРУКЦИЯ ПО ПОЛУЧЕНИЮ DAY_ID:');
    console.log('='.repeat(80));
    console.log(`
1. Скопируйте нужный marathonId из списка выше
2. Откройте старое приложение в браузере
3. Откройте DevTools (F12) → Network tab
4. Перейдите на нужный день курса
5. Найдите запрос к /usermarathon/getdayexercise
6. Скопируйте dayId из параметров запроса

Или используйте скрипт для получения дней:

const marathonId = 'ВАШЕ_MARATHON_ID';
const response = await axios.get(\`\${OLD_API_URL}/usermarathon/getmarathon\`, {
  params: { marathonId },
  headers: {
    'Authorization': \`Bearer \${process.env.OLD_API_TOKEN}\`,
    'UserLanguage': 'en' // или 'ru'
  }
});

console.log(response.data.marathon.marathonDays);
`);
    console.log('='.repeat(80) + '\n');

  } catch (error: any) {
    console.error('❌ ОШИБКА:', error.message);
    if (error.response) {
      console.error('📡 Статус:', error.response.status);
      console.error('💡 Проверьте OLD_API_TOKEN в .env файле');
      console.error('💡 Убедитесь, что API доступно');
    } else if (error.request) {
      console.error('📡 Нет ответа от сервера');
      console.error('💡 Проверьте подключение к интернету');
    }
  }
}

// Запускаем поиск
findMarathonIds();
