// Скрипт для браузерной консоли на https://seplitza.github.io/Rejuvena_old_app/
// Парсит марафон "Омолодись" и сохраняет в JSON

(async function parseOmolodisMarathon() {
  const AZURE_API = 'https://new-facelift-service-b8cta5hpgcqf8c7.eastus-01.azurewebsites.net';
  
  // Получаем токен из localStorage
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('❌ Токен не найден! Сначала залогинься на сайте');
    return;
  }
  
  console.log('✅ Токен найден');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const marathonId = '3842e63f-b125-447d-94a1-b1c93be38b4e';
  console.log(`📚 Парсинг марафона "Омолодись" (ID: ${marathonId})...`);
  
  // Получаем структуру марафона
  const startResponse = await fetch(
    `${AZURE_API}/api/usermarathon/startmarathon?marathonId=${marathonId}`,
    { headers }
  );
  
  if (!startResponse.ok) {
    console.error('❌ Ошибка получения марафона:', startResponse.status);
    return;
  }
  
  const marathonData = await startResponse.json();
  console.log(`✅ Марафон: ${marathonData.title || 'Омолодись'}`);
  console.log(`   Всего дней: ${marathonData.days?.length || 0}`);
  
  const learningDays = [];
  
  // Парсим каждый день обучения
  for (const day of marathonData.days || []) {
    // Пропускаем дни практики
    if (day.dayType && !day.dayType.includes('Learning') && !day.dayType.includes('Обучение')) {
      console.log(`⏭️  День ${day.dayNumber}: ${day.dayType} (пропущен)`);
      continue;
    }
    
    console.log(`📖 День ${day.dayNumber}: ${day.dayType || 'Обучение'}...`);
    
    // Получаем упражнения дня
    const dayResponse = await fetch(
      `${AZURE_API}/api/usermarathon/getdayexercise?dayId=${day.dayId}`,
      { headers }
    );
    
    if (!dayResponse.ok) {
      console.warn(`⚠️  Ошибка получения дня ${day.dayNumber}`);
      continue;
    }
    
    const dayData = await dayResponse.json();
    
    learningDays.push({
      dayId: day.dayId,
      dayNumber: day.dayNumber,
      dayType: day.dayType,
      welcomeMessage: dayData.welcomeMessage || dayData.description || day.welcomeMessage || '',
      exercises: (dayData.exercises || []).map((ex, index) => ({
        exerciseId: ex.exerciseId || ex.id,
        exerciseName: ex.exerciseName || ex.name || ex.title,
        exerciseDescription: ex.exerciseDescription || ex.description || '',
        order: ex.order !== undefined ? ex.order : index + 1
      }))
    });
    
    console.log(`   ✅ ${dayData.exercises?.length || 0} упражнений`);
    
    // Задержка чтобы не перегружать API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const result = {
    marathonId,
    marathonTitle: marathonData.title || 'Омолодись',
    totalDays: learningDays.length,
    parsedAt: new Date().toISOString(),
    days: learningDays
  };
  
  console.log(`\n✅ Парсинг завершён!`);
  console.log(`📊 Дней обучения: ${learningDays.length}`);
  console.log(`📝 Всего упражнений: ${learningDays.reduce((sum, d) => sum + d.exercises.length, 0)}`);
  
  // Скачиваем JSON файл
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'omolodis-parsed.json';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('\n💾 Файл omolodis-parsed.json скачан!');
  console.log('\n📋 Скопируй содержимое в буфер обмена:');
  console.log('copy(', result, ')');
  
  // Сохраняем в window для доступа
  window.parsedMarathon = result;
  
  return result;
})();
