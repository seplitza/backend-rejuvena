import axios from 'axios';
import mongoose from 'mongoose';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';
import { getRuTag } from './utils/ru-tag';

// Подключаемся к MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

interface ExerciseContent {
  id: string;
  type: string;
  contentPath: string;
  order: number;
  videoServer: string;
}

interface ApiExercise {
  id: string;
  exerciseName: string;
  exerciseDescription: string;
  marathonExerciseName: string;
  order: number;
  blockExercise: boolean;
  exerciseContents: ExerciseContent[];
}

interface ApiCategory {
  id: string;
  categoryName: string;
  imagePath: string;
  order: number;
  exercises: ApiExercise[];
}

interface ApiDay {
  id: string;
  day: number;
  dayCategories: ApiCategory[];
}

interface ApiMarathon {
  marathonId: string;
  title: string;
  subTitle: string;
  marathonDay: {
    dayCategories: ApiCategory[];
  };
}

// Функция для очистки HTML описания
function cleanDescription(html: string): string {
  // Простая очистка HTML - удаляем теги iframe и video
  let cleaned = html
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<span[^>]*class="fr-video"[^>]*>.*?<\/span>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '');
  
  return cleaned;
}

// Функция для извлечения всех URL медиа
function extractMediaUrls(contents: ExerciseContent[]): { images: string[], videos: string[] } {
  const images: string[] = [];
  const videos: string[] = [];
  
  contents
    .sort((a, b) => a.order - b.order)
    .forEach(content => {
      if (content.type === 'image' && content.contentPath) {
        images.push(content.contentPath);
      } else if (content.type === 'video' && content.contentPath) {
        // Конвертируем Vimeo URL если нужно
        let videoUrl = content.contentPath;
        if (videoUrl.includes('player.vimeo.com')) {
          const match = videoUrl.match(/vimeo\.com\/video\/(\d+)/);
          if (match) {
            videoUrl = `https://vimeo.com/${match[1]}`;
          }
        }
        videos.push(videoUrl);
      }
    });
  
  return { images, videos };
}

async function importCheeksEyesPro() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Курс "+на щеки и глаза"
    const targetCategoryName = 'PRO на щеки и глаза';
    
    console.log('📥 Загружаем данные из старого API...');
    const response = await axios.get<any>(
      'https://api.faceliftnaturally.me/api/Courses/b87370d5-4ce1-49b2-86f4-23deb9a99123?lang=ru'
    );

    const courseData = response.data;
    console.log(`📚 Курс: ${courseData.title}`);

    // Найти категорию PRO на щеки и глаза
    let targetCategory: ApiCategory | undefined;
    
    for (const day of courseData.days) {
      const category = day.categories.find((cat: any) => cat.name === targetCategoryName);
      if (category) {
        targetCategory = {
          id: category.id,
          categoryName: category.name,
          imagePath: '',
          order: category.order,
          exercises: category.exercises
        };
        break;
      }
    }

    if (!targetCategory) {
      console.log(`❌ Категория "${targetCategoryName}" не найдена`);
      return;
    }

    console.log(`📂 Категория: ${targetCategory.categoryName} (${targetCategory.exercises.length} упражнений)`);

    // Создаем/получаем теги
    const ruTag = await getRuTag();
    const tagNames = ['нащекииглаза', 'продвинутое'];
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await Tag.findOne({ name });
        if (!tag) {
          tag = await Tag.create({ name, color: '#3B82F6' });
          console.log(`✅ Создан тег: #${name}`);
        }
        return tag;
      })
    );
    tags.push(ruTag);
    const tagIds = tags.map(tag => tag._id);

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    // Импортируем только упражнения из PRO категории
    for (const exercise of targetCategory.exercises) {
      // Пропускаем заблокированные
      if (exercise.blockExercise) {
        console.log(`⏭️  Пропуск (заблокировано): ${exercise.exerciseName}`);
        skipped++;
        continue;
      }

      try {
        // Проверяем, существует ли упражнение
        const existing = await Exercise.findOne({ apiId: exercise.id });

        const { images, videos } = extractMediaUrls(exercise.exerciseContents);
        const description = cleanDescription(exercise.exerciseDescription);

        const exerciseData = {
          apiId: exercise.id,
          name: exercise.exerciseName,
          description: description,
          duration: exercise.marathonExerciseName || '',
          carouselMedia: images,
          videos: videos,
          tags: tagIds,
          order: exercise.order,
          category: targetCategory.categoryName
        };

        if (existing) {
          await Exercise.findByIdAndUpdate(existing._id, exerciseData);
          console.log(`🔄 Обновлено: ${exercise.exerciseName}`);
          updated++;
        } else {
          await Exercise.create(exerciseData);
          console.log(`✅ Импортировано: ${exercise.exerciseName}`);
          imported++;
        }
      } catch (error) {
        console.error(`❌ Ошибка при импорте "${exercise.exerciseName}":`, error);
      }
    }

    console.log('\n📊 Результаты импорта:');
    console.log(`✅ Импортировано новых: ${imported}`);
    console.log(`🔄 Обновлено: ${updated}`);
    console.log(`⏭️  Пропущено: ${skipped}`);
    console.log(`📦 Всего обработано: ${imported + updated + skipped}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
  }
}

// Запуск
importCheeksEyesPro().catch(console.error);
