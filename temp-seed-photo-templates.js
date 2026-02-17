// Quick seed photo diary templates
db = db.getSiblingDB('rejuvena');

const templates = [
  {
    type: 'photo_diary_7days',
    name: 'Фотодневник: осталось 7 дней',
    slug: 'photo-diary-expiry-7days',
    category: 'photo_diary',
    subject: '⏰ Фотодневник будет деактивирован через 7 дней',
    htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2>Привет, {{firstName}}!</h2><p>Срок хранения ваших фотографий истекает через <strong>7 дней</strong>.</p><p>Дата деактивации: {{photoDiaryEndDate}}</p><p><a href="{{baseUrl}}/profile/settings">Продлить хранение фото</a></p></div>',
    textTemplate: 'Привет, {{firstName}}! Срок хранения ваших фотографий истекает через 7 дней. Дата: {{photoDiaryEndDate}}',
    variables: ['firstName', 'photoDiaryEndDate', 'baseUrl'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'photo_diary_3days',
    name: 'Фотодневник: осталось 3 дня',
    slug: 'photo-diary-expiry-3days',
    category: 'photo_diary',
    subject: '⚠️ Фотодневник будет деактивирован через 3 дня',
    htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2>Привет, {{firstName}}!</h2><p>Срок хранения ваших фотографий истекает через <strong>3дня</strong>.</p><p>Дата деактивации: {{photoDiaryEndDate}}</p><p><a href="{{baseUrl}}/profile/settings">Продлить хранение фото</a></p></div>',
    textTemplate: 'Привет, {{firstName}}! Срок хранения ваших фотографий истекает через 3 дня. Дата: {{photoDiaryEndDate}}',
    variables: ['firstName', 'photoDiaryEndDate', 'baseUrl'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    type: 'photo_diary_1day',
    name: 'Фотодневник: осталось 24 часа',
    slug: 'photo-diary-expiry-1day',
    category: 'photo_diary',
    subject: '🚨 Фотодневник будет деактивирован завтра',
    htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h2>Привет, {{firstName}}!</h2><p>Срок хранения ваших фотографий истекает <strong>завтра</strong>!</p><p>Дата деактивации: {{photoDiaryEndDate}}</p><p><a href="{{baseUrl}}/profile/settings">Продлить хранение фото</a></p></div>',
    textTemplate: 'Привет, {{firstName}}! Срок хранения ваших фотографий истекает завтра! Дата: {{photoDiaryEndDate}}',
    variables: ['firstName', 'photoDiaryEndDate', 'baseUrl'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

templates.forEach(template => {
  db.emailtemplates.updateOne(
    { slug: template.slug },
    { $set: template },
    { upsert: true }
  );
  print('Created/updated template: ' + template.slug);
});

print('✅ Done! Created ' + templates.length + ' templates');
print('Count:', db.emailtemplates.find({category: 'photo_diary'}).count());
