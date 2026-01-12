import Tag from '../../models/Tag.model';

/**
 * Получает или создает тег RU (скрытый тег для русских упражнений)
 */
export async function getRuTag() {
  let ruTag = await Tag.findOne({ name: 'RU' });
  
  if (!ruTag) {
    ruTag = await Tag.create({
      name: 'RU',
      slug: 'ru',
      color: '#3B82F6',
      isVisible: false
    });
    console.log('✅ Создан скрытый тег RU');
  } else if (ruTag.isVisible !== false) {
    ruTag.isVisible = false;
    await ruTag.save();
    console.log('✅ Тег RU настроен как скрытый');
  }
  
  return ruTag;
}
