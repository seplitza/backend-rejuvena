import axios from 'axios';
import fs from 'fs';
import path from 'path';

const AZURE_API = 'https://new-facelift-service-b8cta5hpgcqf8c7.eastus-01.azurewebsites.net';

interface AzureAuthResponse {
  access_token: string;
  username: string;
  email: string;
  expires_in: number;
  refresh_token: string;
  role: string;
}

interface AzureDay {
  dayId: string;
  dayNumber: number;
  dayType: string;
  welcomeMessage: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    exerciseDescription: string;
    order: number;
  }>;
}

async function parseOmolodisMarathon() {
  console.log('🔐 Авторизация на Azure API...');
  
  // Step 1: Login
  const authResponse = await axios.post<AzureAuthResponse>(
    `${AZURE_API}/api/token/auth`,
    {
      username: 'seplitza@gmail.com',
      password: '1234',
      grant_type: 'password'
    }
  );

  const token = authResponse.data.access_token;
  console.log('✅ Токен получен');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  // Step 2: Get marathon ID from course page
  const marathonId = '3842e63f-b125-447d-94a1-b1c93be38b4e';
  console.log(`\n📚 Парсинг марафона "Омолодись" (ID: ${marathonId})...`);

  // Step 3: Start marathon to get all days
  const startResponse = await axios.get(
    `${AZURE_API}/api/usermarathon/startmarathon`,
    {
      headers,
      params: { marathonId }
    }
  );

  const marathonData = startResponse.data;
  console.log(`✅ Получены данные марафона: ${marathonData.title || 'Омолодись'}`);
  console.log(`   Всего дней: ${marathonData.days?.length || 0}`);

  // Step 4: Parse each learning day
  const learningDays: AzureDay[] = [];
  
  if (marathonData.days && Array.isArray(marathonData.days)) {
    for (const day of marathonData.days) {
      // Skip practice days
      if (day.dayType !== 'Learning' && day.dayType !== 'Обучение') {
        console.log(`⏭️  Пропускаю день ${day.dayNumber} (${day.dayType})`);
        continue;
      }

      console.log(`\n📖 Парсинг дня ${day.dayNumber} (${day.dayType})...`);

      // Get day exercises
      const dayResponse = await axios.get(
        `${AZURE_API}/api/usermarathon/getdayexercise`,
        {
          headers,
          params: { dayId: day.dayId }
        }
      );

      const dayData = dayResponse.data;
      
      learningDays.push({
        dayId: day.dayId,
        dayNumber: day.dayNumber,
        dayType: day.dayType,
        welcomeMessage: dayData.welcomeMessage || dayData.description || '',
        exercises: (dayData.exercises || []).map((ex: any, index: number) => ({
          exerciseId: ex.exerciseId || ex.id,
          exerciseName: ex.exerciseName || ex.name || ex.title,
          exerciseDescription: ex.exerciseDescription || ex.description || '',
          order: ex.order || index + 1
        }))
      });

      console.log(`   ✅ ${dayData.exercises?.length || 0} упражнений`);
    }
  }

  // Step 5: Save to JSON
  const outputPath = path.join(__dirname, '../../data/omolodis-parsed.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify({
      marathonId,
      marathonTitle: marathonData.title || 'Омолодись',
      totalDays: learningDays.length,
      parsedAt: new Date().toISOString(),
      days: learningDays
    }, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Парсинг завершён!`);
  console.log(`📁 Данные сохранены: ${outputPath}`);
  console.log(`📊 Всего дней обучения: ${learningDays.length}`);
  console.log(`📝 Всего упражнений: ${learningDays.reduce((sum, d) => sum + d.exercises.length, 0)}`);

  return outputPath;
}

parseOmolodisMarathon()
  .then(filePath => {
    console.log(`\n🎉 Готово! Файл: ${filePath}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Ошибка:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
    process.exit(1);
  });
