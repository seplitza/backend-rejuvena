// Скрипт для поиска ID дня 11 марафона "Омолодись" в локальной БД
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/rejuvena';
const MARATHON_ID = '697dde2ce5bf02ef8d04876d';

async function findDay11() {
  console.log('🔌 Connecting to local MongoDB...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const collection = db.collection('marathondays');
    
    // Найти все дни марафона "Омолодись"
    const days = await collection
      .find({ marathonId: new ObjectId(MARATHON_ID) })
      .sort({ dayNumber: 1 })
      .toArray();
    
    console.log(`📋 Найдено дней: ${days.length}\n`);
    
    if (days.length === 0) {
      console.log('⚠️ Дни не найдены. Возможно, база данных пустая или неверный MARATHON_ID.');
      console.log('Попробуйте подключиться через SSH туннель к production БД.\n');
      return;
    }
    
    // Вывести все дни с их ID
    days.forEach(day => {
      const mark = day.dayNumber === 11 ? ' ⭐' : '';
      console.log(`День ${day.dayNumber}: ${day._id}${mark}`);
    });
    
    // Найти день 11
    const day11 = days.find(d => d.dayNumber === 11);
    
    if (day11) {
      console.log(`\n✅ День 11 найден!`);
      console.log(`   ID: ${day11._id}`);
      console.log(`   Заголовок: ${day11.title || 'Нет заголовка'}`);
      console.log(`   Описание: ${day11.description ? `${day11.description.substring(0, 100)}...` : 'Пусто'}`);
      
      console.log(`\n📋 Для добавления в скрипт update-production-via-tunnel.js:`);
      console.log(`  11: '${day11._id}',`);
    } else {
      console.log(`\n⚠️ День 11 не найден в базе данных!`);
      console.log('Возможные причины:');
      console.log('- День 11 еще не создан в системе');
      console.log('- Неверный MARATHON_ID');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️ MongoDB не запущен на localhost:27017');
      console.error('Попробуйте подключиться к production через SSH туннель.');
    }
  } finally {
    await client.close();
  }
}

findDay11();
