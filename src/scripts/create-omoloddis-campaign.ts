/**
 * Create Email Campaign for "Омолодись" Marathon
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import EmailCampaign from '../models/EmailCampaign.model';
import EmailTemplate from '../models/EmailTemplate.model';
import Marathon from '../models/Marathon.model';

dotenv.config();

async function createOmoloddisCampaign() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Find "Омолодись" marathon
    const marathons = await Marathon.find({ 
      title: { $regex: /омолод/i } 
    });
    
    console.log(`\nНайдено марафонов: ${marathons.length}`);
    marathons.forEach(m => {
      console.log(`- ${m.title} (${m._id})`);
    });

    if (marathons.length === 0) {
      console.log('\n❌ Марафон "Омолодись" не найден');
      return;
    }

    const marathon = marathons[0];
    console.log(`\n✓ Используем марафон: ${marathon.title}`);

    // Find email templates
    const templates = await EmailTemplate.find({ isActive: true });
    console.log(`\n✓ Найдено шаблонов: ${templates.length}`);
    
    const enrollmentTemplate = templates.find(t => t.type === 'enrollment');
    const startTemplate = templates.find(t => t.type === 'start');
    const dailyTemplate = templates.find(t => t.type === 'daily_reminder');
    const completionTemplate = templates.find(t => t.type === 'completion');

    if (!enrollmentTemplate || !startTemplate) {
      console.log('❌ Не найдены необходимые шаблоны');
      return;
    }

    // Check if campaign already exists
    const existing = await EmailCampaign.findOne({
      'trigger.marathonId': marathon._id,
      'trigger.type': 'marathon_start'
    });

    if (existing) {
      console.log(`\n⚠️ Кампания уже существует: ${existing.name}`);
      console.log(`ID: ${existing._id}`);
      console.log(`Активна: ${existing.isActive ? 'Да' : 'Нет'}`);
      console.log(`Шагов: ${existing.steps.length}`);
      return;
    }

    // Create campaign
    const campaign = new EmailCampaign({
      name: `Марафон "${marathon.title}" - Автоматическая цепочка`,
      description: 'Приветствие и мотивация участников на протяжении всего марафона',
      trigger: {
        type: 'marathon_start',
        marathonId: marathon._id
      },
      steps: [
        // Step 1: Приветствие в день старта
        {
          id: `step_${Date.now()}_1`,
          templateId: startTemplate._id,
          delay: 0,
          delayUnit: 'hours',
          position: { x: 100, y: 100 }
        },
        // Step 2: Мотивация на 3 день
        {
          id: `step_${Date.now()}_2`,
          templateId: dailyTemplate?._id || startTemplate._id,
          delay: 2,
          delayUnit: 'days',
          condition: {
            type: 'all'
          },
          position: { x: 100, y: 250 }
        },
        // Step 3: Проверка прогресса на 7 день
        {
          id: `step_${Date.now()}_3`,
          templateId: dailyTemplate?._id || startTemplate._id,
          delay: 4,
          delayUnit: 'days',
          condition: {
            type: 'all'
          },
          position: { x: 100, y: 400 }
        },
        // Step 4: Поздравление в конце (если есть шаблон)
        ...(completionTemplate ? [{
          id: `step_${Date.now()}_4`,
          templateId: completionTemplate._id,
          delay: marathon.numberOfDays - 7,
          delayUnit: 'days' as 'days',
          condition: {
            type: 'all' as 'all'
          },
          position: { x: 100, y: 550 }
        }] : [])
      ],
      isActive: false, // Не активируем сразу, пусть админ проверит
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      }
    });

    await campaign.save();

    console.log('\n✅ Кампания создана успешно!');
    console.log(`ID: ${campaign._id}`);
    console.log(`Название: ${campaign.name}`);
    console.log(`Триггер: ${campaign.trigger.type}`);
    console.log(`Шагов: ${campaign.steps.length}`);
    console.log(`\n⚠️ Кампания НЕ АКТИВНА - откройте в админке и проверьте настройки`);
    console.log(`URL: http://localhost:9527/admin/email-campaigns/${campaign._id}`);
    console.log(`Production: https://api-rejuvena.duckdns.org/admin/email-campaigns/${campaign._id}`);

  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

createOmoloddisCampaign();
