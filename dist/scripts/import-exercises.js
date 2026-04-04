"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
dotenv_1.default.config();
// Упражнения из web/src/data/exercisesData.ts
const EXERCISES_DATA = [
    {
        id: '4c203ead-0590-4ad4-81ae-34ceead16eac',
        exerciseName: 'Базовая растяжка шеи',
        description: 'Базовая растяжка мышц шеи для улучшения гибкости и снятия напряжения',
        duration: 300,
    },
    {
        id: 'c54d0429-db51-48af-a890-03e2b257cae6',
        exerciseName: 'Вращения головой',
        description: 'Вращения головой для разминки шейного отдела позвоночника',
        duration: 300,
    },
    {
        id: 'c31c761f-ef35-4189-9f05-a12009775c22',
        exerciseName: 'Растяжка передней поверхности шеи',
        description: 'Растяжка передней части шеи для коррекции осанки',
        duration: 300,
    },
    {
        id: '9dd63c7a-60e0-476c-acfb-5264d0de3fc2',
        exerciseName: 'На заднюю поверхность шеи',
        description: 'Упражнение для укрепления задней поверхности шеи',
        duration: 300,
    },
    {
        id: '2ed8b873-e5dc-4d83-8058-f926827afaf0',
        exerciseName: 'На боковую поверхность шеи',
        description: 'Боковые наклоны для растяжки боковых мышц шеи',
        duration: 300,
    },
    {
        id: 'eae9d289-4eb5-4c8f-9617-20f1d88b19e1',
        exerciseName: 'На мышцы трапеции',
        description: 'Расслабление и растяжка трапециевидных мышц',
        duration: 300,
    },
    {
        id: 'bec0210f-646d-4d63-b4a0-aa8e419aeca2',
        exerciseName: 'Раскрытие плечевых 1',
        description: 'Раскрытие грудной клетки и плечевого пояса для улучшения осанки',
        duration: 300,
    },
    {
        id: '24a6f431-9200-4c27-b491-09c9f4b96a20',
        exerciseName: 'Раскрытие плечевых 2',
        description: 'Продолжение раскрытия плечевого пояса с углублением растяжки',
        duration: 300,
    },
    {
        id: 'a8d8a1f3-6765-4031-bbb8-cf0baf47f7af',
        exerciseName: 'Стоечка у стены',
        description: `<h3>Стоечка у стены</h3>
<p>Это упражнение - царь упражнений для осанки!</p>
<p>Это незаменимый прием для возвращения головы в здоровое положение. Упражнение статическое, кажется лёгким, однако лучше сначала попробовать, прежде, чем высказывать такие суждения.😁</p>
<p>Первый раз попробуй выдержать минуту, затем ты можешь постепенно увеличивать продолжительность, в идеале до 10 минут в день. 💪</p>
<p><strong>Что дает нам стоечка у стены:</strong></p>
<ul>
  <li>Улучшается статика шеи.</li>
  <li>Шея становится длинной и сильной.</li>
  <li>Позвоночник вспоминает свое выпрямленное естественное положение.</li>
  <li>Потребление кислорода увеличивается, поскольку в этой позе ваши легкие могут поглощать больше воздуха.</li>
  <li>Нервная система укрепляется.</li>
</ul>`,
        duration: 300,
        content: `<h3>Стоечка у стены</h3>
<p>Это упражнение - царь упражнений для осанки!</p>
<p>Это незаменимый прием для возвращения головы в здоровое положение. Упражнение статическое, кажется лёгким, однако лучше сначала попробовать, прежде, чем высказывать такие суждения.😁</p>
<p>Первый раз попробуй выдержать минуту, затем ты можешь постепенно увеличивать продолжительность, в идеале до 10 минут в день. 💪</p>
<p><strong>Что дает нам стоечка у стены:</strong></p>
<ul>
  <li>Улучшается статика шеи.</li>
  <li>Шея становится длинной и сильной.</li>
  <li>Позвоночник вспоминает свое выпрямленное естественное положение.</li>
  <li>Потребление кислорода увеличивается, поскольку в этой позе ваши легкие могут поглощать больше воздуха.</li>
  <li>Нервная система укрепляется.</li>
</ul>
<p><strong>Видео:</strong></p>
<p><a href="https://rutube.ru/video/6e88a547d703e3f8eece1db9b62e3e77/">Смотреть видео на Rutube</a></p>`,
    },
    {
        id: '2ac880c8-2c14-4b45-b7aa-d1b0d538a769',
        exerciseName: 'На валике',
        description: 'Расслабляющее упражнение на массажном валике для спины и шеи',
        duration: 600,
    },
];
const importExercises = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Найти теги для упражнений (например, "Растяжка", "Начинающий")
        const stretchingTag = await Tag_model_1.default.findOne({ slug: 'stretching' });
        const beginnerTag = await Tag_model_1.default.findOne({ slug: 'beginner' });
        const tagIds = [stretchingTag?._id, beginnerTag?._id].filter(Boolean);
        let imported = 0;
        let skipped = 0;
        for (const exerciseData of EXERCISES_DATA) {
            // Проверяем, существует ли уже упражнение с таким названием
            const existing = await Exercise_model_1.default.findOne({ title: exerciseData.exerciseName });
            if (existing) {
                console.log(`⏭️  Пропущено (уже существует): ${exerciseData.exerciseName}`);
                skipped++;
                continue;
            }
            // Создаем упражнение
            const exercise = new Exercise_model_1.default({
                title: exerciseData.exerciseName,
                description: exerciseData.description,
                content: exerciseData.content || `<p>${exerciseData.description}</p>`,
                carouselMedia: [],
                tags: tagIds,
                isPublished: true, // Публикуем сразу
            });
            await exercise.save();
            console.log(`✅ Импортировано: ${exerciseData.exerciseName}`);
            imported++;
        }
        console.log('\n📊 Результаты импорта:');
        console.log(`   ✅ Импортировано: ${imported}`);
        console.log(`   ⏭️  Пропущено: ${skipped}`);
        console.log(`   📝 Всего: ${EXERCISES_DATA.length}`);
        console.log('\n✅ Импорт завершен!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Ошибка импорта:', error);
        process.exit(1);
    }
};
importExercises();
