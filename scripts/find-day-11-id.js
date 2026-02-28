// Скрипт для поиска ID дня 11 марафона "Омолодись"
// ВАЖНО: Сначала запустите SSH туннель:
// ssh -L 27018:localhost:27017 root@37.252.20.170

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27018/rejuvena';
const MARATHON_ID = '697dde2ce5bf02ef8d04876d';

async function findDay11() {
  console.log('🔌 Connecting to production MongoDB via SSH tunnel...\n');
  
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
      
      console.log(`\n📋 Для добавления в скрипт:`);
      console.log(`  11: '${day11._id}',`);
    } else {
      console.log(`\n⚠️ День 11 не найден в базе данных!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️ Connection refused. Did you start the SSH tunnel?');
      console.error('Run this command in a separate terminal:');
      console.error('ssh -L 27018:localhost:27017 root@37.252.20.170');
    }
  } finally {
    await client.close();
  }
}

findDay11();
