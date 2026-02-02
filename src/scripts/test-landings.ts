import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Landing from '../models/Landing.model';
import User from '../models/User.model';
import Marathon from '../models/Marathon.model';

dotenv.config();

const testLandings = async () => {
  try {
    console.log('🚀 Starting Landing System Test...\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
    console.log('✅ Connected to MongoDB\n');

    // Получаем тестового пользователя
    const user = await User.findOne({ email: 'seplitza@gmail.com' });
    if (!user) {
      console.error('❌ User not found. Run npm run seed first.');
      process.exit(1);
    }
    console.log(`👤 Using user: ${user.email}\n`);

    // Получаем марафоны для теста
    const marathons = await Marathon.find().limit(2);
    console.log(`🏃 Found ${marathons.length} marathons for testing\n`);

    // 1. Удаляем старый тестовый лендинг если есть
    await Landing.deleteMany({ slug: 'marathon-7-test' });
    console.log('🗑️  Cleared old test landings\n');

    // 2. Создаем новый лендинг
    console.log('📝 Creating new landing...');
    const newLanding = new Landing({
      slug: 'marathon-7-test',
      title: 'Марафон Сеплица 7 этап - Естественное омоложение',
      metaDescription: 'Присоединяйтесь к 7 этапу марафона Сеплица! Базовый курс стартует 9 февраля, продвинутый - 23 февраля. Результат уже через 2 недели!',
      ogImage: '/uploads/marathon-7-og.jpg',
      
      heroSection: {
        backgroundImage: '/uploads/hero-bg.jpg',
        title: 'Марафон Сеплица - 7 этап',
        subtitle: 'Естественное омоложение без инъекций и операций. Старт 9 февраля!',
        ctaButton: {
          text: 'Записаться сейчас',
          link: '#marathons'
        }
      },
      
      marathonsSection: {
        sectionTitle: 'Выберите свой уровень',
        basic: {
          marathonId: marathons[0]?._id,
          title: 'Базовый уровень',
          startDate: new Date('2026-02-09'),
          price: 3000,
          duration: '14 дней обучения + 30 дней практики',
          features: [
            '33 упражнения с HD-видео',
            'Лимфодренажные техники',
            'Коррекция осанки и шеи',
            'Фотодневник с ИИ',
            'Поддержка в чате 24/7'
          ],
          ctaButton: {
            text: 'Начать обучение',
            link: '/marathons'
          }
        },
        advanced: {
          marathonId: marathons[1]?._id,
          title: 'Продвинутый уровень',
          startDate: new Date('2026-02-23'),
          price: 5000,
          duration: '21 день обучения + 60 дней практики',
          features: [
            'Все техники базового уровня',
            'Вакуумные техники',
            'Лифтинг-массажи PRO',
            'Индивидуальная консультация',
            'Эксклюзивные упражнения',
            'VIP группа в Telegram'
          ],
          ctaButton: {
            text: 'Перейти на PRO',
            link: '/marathons'
          }
        }
      },
      
      benefitsSection: {
        sectionTitle: 'Почему выбирают систему Сеплица',
        benefits: [
          {
            icon: '💰',
            title: 'Экономия',
            description: 'Один курс у косметолога — от 100,000₽/год. Марафон — всего 3,000₽ за 44 дня (68₽ в день!)'
          },
          {
            icon: '⏰',
            title: 'Удобство',
            description: 'Всего 15-20 минут в день, занимайтесь дома в удобное время'
          },
          {
            icon: '🌱',
            title: 'Безопасность',
            description: 'Никаких операций, инъекций и рисков осложнений'
          },
          {
            icon: '📈',
            title: 'Результат',
            description: 'Естественное омоложение соразмерно вашим усилиям'
          }
        ]
      },
      
      testimonialsSection: {
        sectionTitle: 'Отзывы наших участников',
        testimonials: [
          {
            name: 'Елена С.',
            age: '52 года',
            text: 'Через 2 недели я выгляжу как с 48 до 43, мне 56! Если бы я увидела вас, я бы затискала вас до смерти! Еще много работы предстоит сделать, но я в правильном месте!',
            rating: 5,
            image: '/uploads/testimonial-1.jpg'
          },
          {
            name: 'Марина К.',
            age: '49 лет',
            text: 'Система работает! Я занимаюсь уже 3 месяца и вижу конкретные изменения. Лицо стало более подтянутым, отеки ушли, кожа стала более упругой.',
            rating: 5,
            image: '/uploads/testimonial-2.jpg'
          }
        ]
      },
      
      ctaSection: {
        title: 'Готовы начать своё преображение?',
        subtitle: 'Присоединяйтесь к марафону и получите доступ ко всем материалам',
        buttonText: 'Записаться на марафон',
        buttonLink: '/marathons',
        backgroundImage: '/uploads/cta-bg.jpg'
      },
      
      isPublished: false,
      views: 0,
      conversions: 0,
      createdBy: user._id
    });

    await newLanding.save();
    console.log(`✅ Landing created: ${newLanding.slug}`);
    console.log(`   ID: ${newLanding._id}\n`);

    // 3. Проверяем чтение
    console.log('📖 Testing read operation...');
    const foundLanding = await Landing.findById(newLanding._id);
    console.log(`✅ Found landing: ${foundLanding?.title}\n`);

    // 4. Проверяем обновление
    console.log('✏️  Testing update operation...');
    foundLanding!.title = 'Марафон Сеплица 7 этап - ОБНОВЛЕНО';
    await foundLanding!.save();
    console.log(`✅ Landing updated\n`);

    // 5. Проверяем публикацию
    console.log('🚀 Testing publish operation...');
    foundLanding!.isPublished = true;
    foundLanding!.publishedAt = new Date();
    await foundLanding!.save();
    console.log(`✅ Landing published\n`);

    // 6. Проверяем счетчики
    console.log('📊 Testing counters...');
    foundLanding!.views = 100;
    foundLanding!.conversions = 5;
    await foundLanding!.save();
    console.log(`✅ Counters updated: ${foundLanding!.views} views, ${foundLanding!.conversions} conversions\n`);

    // 7. Проверяем поиск по slug
    console.log('🔍 Testing public access by slug...');
    const publicLanding = await Landing.findOne({ 
      slug: 'marathon-7-test', 
      isPublished: true 
    });
    console.log(`✅ Public landing found: ${publicLanding?.title}\n`);

    // 8. Статистика
    console.log('📈 Final Statistics:');
    const totalLandings = await Landing.countDocuments();
    const publishedLandings = await Landing.countDocuments({ isPublished: true });
    console.log(`   Total landings: ${totalLandings}`);
    console.log(`   Published: ${publishedLandings}`);
    console.log(`   Drafts: ${totalLandings - publishedLandings}\n`);

    console.log('✨ All tests passed successfully!\n');
    console.log('🎯 Next steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start admin panel: cd admin-panel && npm run dev');
    console.log('   3. Open: http://localhost:5173/admin/landings');
    console.log(`   4. Find landing with slug: ${newLanding.slug}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testLandings();
