import axios from 'axios';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';

// Базовый курс "Look Younger"
const MARATHON_ID = '8ae4db8b-b256-462a-8918-7e7811243d64';

async function fetchLookYoungerCourse() {
  try {
    console.log('📡 Запрашиваем список дней курса "Look Younger"...\n');

    // Сначала получим список марафонов, чтобы узнать структуру дней
    const marathonsResponse = await axios.get(`${OLD_API_URL}/usermarathon/startmarathons`, {
      headers: {
        'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
        'UserLanguage': 'en'
      }
    });

    const lookYounger = marathonsResponse.data.find((m: any) => m.id === MARATHON_ID);
    
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
    const enrollResponse = await axios.post(
      `${OLD_API_URL}/usermarathon/enrollmarathon`,
      {
        marathonId: MARATHON_ID,
        timeZoneOffset: -180
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OLD_API_TOKEN}`,
          'UserLanguage': 'en'
        }
      }
    );

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
    const dayResponse = await axios.get(`${OLD_API_URL}/usermarathon/getdayexercise`, {
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
    categories.forEach((cat: any) => {
      console.log(`   📂 ${cat.categoryName}: ${cat.exercises?.length || 0} упражнений`);
      totalExercises += cat.exercises?.length || 0;
    });

    console.log(`\n📊 Всего упражнений: ${totalExercises}\n`);

    // Сохраняем в JSON
    const outputPath = './look-younger-day1-data.json';
    fs.writeFileSync(outputPath, JSON.stringify(dayData, null, 2));
    console.log(`💾 Данные сохранены в: ${outputPath}\n`);

    console.log('✅ Готово! Теперь можно импортировать упражнения.');

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fetchLookYoungerCourse();
