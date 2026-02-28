import Tag from '../../models/Tag.model';

/**
 * Получает или создает тег EN (скрытый тег для английских упражнений)
 */
export async function getEnTag() {
  let enTag = await Tag.findOne({ name: 'EN' });
  
  if (!enTag) {
    enTag = await Tag.create({
      name: 'EN',
      slug: 'en',
      color: '#10B981',
      isVisible: false
    });
    console.log('✅ Создан скрытый тег EN');
  } else if (enTag.isVisible !== false) {
    enTag.isVisible = false;
    await enTag.save();
    console.log('✅ Тег EN настроен как скрытый');
  }
  
  return enTag;
}
