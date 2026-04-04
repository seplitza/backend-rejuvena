"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Landing_model_1 = __importDefault(require("../models/Landing.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function populateLandingSections() {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        // Найдем существующий лендинг
        const landing = await Landing_model_1.default.findOne({ slug: 'omolodis-stage-7-2280' });
        if (!landing) {
            console.log('❌ Landing not found');
            process.exit(1);
        }
        console.log('📝 Updating landing with new sections...');
        // Добавляем секции с данными из оригинального лендинга
        landing.featuresSection = {
            sectionTitle: 'Что такое система Сеплица?',
            subtitle: '4 ступени погружения для достижения естественного омоложения',
            features: [
                {
                    icon: '🏃',
                    title: 'Забота о теле',
                    description: 'Зарядка долголетия за 25 минут и тренировки для увеличения потенциала жизни. Разглаживаем «миофасциальный костюмчик»'
                },
                {
                    icon: '💆',
                    title: 'Забота о лице и шее',
                    description: 'Практики самомассажа, работа с осанкой и лимфодренажные упражнения. Эстетическое омоложение без инъекций'
                },
                {
                    icon: '🧬',
                    title: 'Клеточное здоровье',
                    description: 'Биохакинг: помощь клеткам в жизнедеятельности, укрепление защитных свойств, восполнение критически важных запасов'
                },
                {
                    icon: '🦠',
                    title: 'Забота о микробиоме',
                    description: 'Работа с микрофлорой: разнообразное питание, пребиотики и ферментированные продукты для здоровья организма'
                }
            ]
        };
        landing.problemsSection = {
            sectionTitle: 'Сеплица стирает возрастные признаки',
            subtitle: 'От 20 до 40 минут в день, чтобы выглядеть моложе',
            problems: [
                {
                    number: '01',
                    title: 'Отеки и птоз лица',
                    description: 'Отек лица, обвисшее верхнее веко, мешки под глазами, брыльки — все это поддается коррекции с помощью лимфодренажа и самомассажа'
                },
                {
                    number: '02',
                    title: 'Морщины и складки',
                    description: 'Носогубные складки, гусиные лапки, морщины на лбу, кисетные морщины вокруг рта — система работает со всеми видами морщин'
                },
                {
                    number: '03',
                    title: 'Проблемы с осанкой',
                    description: 'Склоненная голова, «шея программиста», холка, проблема с С7 — упражнения на осанку с акцентом на шею решают эти проблемы'
                },
                {
                    number: '04',
                    title: 'Пигментация и тонус',
                    description: 'Пигментные пятна, потеря тонуса кожи — клеточный биохакинг помогает восстановить здоровье кожи изнутри'
                }
            ]
        };
        landing.aboutSection = {
            sectionTitle: 'Обо мне',
            name: 'Алексей Пинаев',
            bio: `Меня зовут Алексей Пинаев, и я создатель системы Сеплица.

Последние годы я посвятил изучению процессов естественного омоложения и долголетия.

Мой подход основан на глубоком понимании физиологии, комплексной работе с телом и индивидуальных потребностях каждого человека.`,
            photo: 'http://37.252.20.170/uploads/hero/1766750121294-791751151.jpg',
            achievements: [
                {
                    icon: '🎓',
                    title: 'Образование',
                    description: 'Международный институт anti-age медицины'
                },
                {
                    icon: '⭐',
                    title: 'Опыт',
                    description: '10,000+ довольных последователей'
                },
                {
                    icon: '📚',
                    title: 'Достижения',
                    description: 'Создатель системы естественного омоложения Сеплица'
                }
            ]
        };
        landing.stepsSection = {
            sectionTitle: '4 ступени системы Сеплица',
            subtitle: 'Холистический подход к продлению молодости и долголетию',
            steps: [
                {
                    title: '1. Зарядка долголетия',
                    description: '33 упражнения за 25 минут разбудят ток лимфы, повысят подвижность и запустят регенерацию всего тела. Ежедневно в прямом эфире в 7:00 МСК'
                },
                {
                    title: '2. Самомассаж лица',
                    description: 'Практики самомассажа, работа с осанкой и лимфодренажные упражнения. Профилактика и избавление от морщин и отёков без инъекций'
                },
                {
                    title: '3. Клеточный биохакинг',
                    description: 'Очищение межклеточного вещества, аутофагия, укрепление мембран, ремонт ДНК. Приём NMN, Омега-3, кверцетина, ресвератрола'
                },
                {
                    title: '4. Забота о микробиоме',
                    description: 'Разнообразное питание, пребиотики и ферментированные продукты. Не убивать микрофлору консервантами и антибиотиками'
                }
            ]
        };
        landing.processSection = {
            sectionTitle: 'Как проходит программа',
            subtitle: 'Пошаговый путь к вашему омоложению',
            steps: [
                {
                    number: 1,
                    title: 'Диагностика и анализ',
                    description: 'Комплексное обследование организма, определение биологического возраста и выявление проблемных зон',
                    duration: '1-2 дня'
                },
                {
                    number: 2,
                    title: 'Персональная программа',
                    description: 'Разработка индивидуального плана омоложения с учетом ваших особенностей и целей',
                    duration: '3-5 дней'
                },
                {
                    number: 3,
                    title: 'Запуск программы',
                    description: 'Начало активной фазы: питание, физическая активность, дыхательные практики, детокс',
                    duration: '21 день'
                },
                {
                    number: 4,
                    title: 'Закрепление результата',
                    description: 'Стабилизация достигнутых результатов и формирование новых здоровых привычек',
                    duration: '2-3 месяца'
                },
                {
                    number: 5,
                    title: 'Долгосрочное сопровождение',
                    description: 'Регулярный контроль показателей и корректировка программы для поддержания эффекта',
                    duration: 'Постоянно'
                }
            ]
        };
        landing.statsSection = {
            sectionTitle: 'Результаты наших клиентов',
            stats: [
                {
                    value: '-7 лет',
                    label: 'Биологический возраст',
                    description: 'В среднем наши клиенты молодеют на 5-10 лет по биологическим показателям'
                },
                {
                    value: '+45%',
                    label: 'Уровень энергии',
                    description: 'Значительное повышение жизненного тонуса и работоспособности'
                },
                {
                    value: '92%',
                    label: 'Улучшение кожи',
                    description: 'Заметное улучшение состояния кожи, сокращение морщин и пигментации'
                },
                {
                    value: '-12 кг',
                    label: 'Средняя потеря веса',
                    description: 'Нормализация веса без жестких диет и голодания'
                }
            ]
        };
        await landing.save();
        console.log('✅ Landing updated successfully!');
        console.log(`📊 Added ${landing.featuresSection?.features.length} features`);
        console.log(`📊 Added ${landing.problemsSection?.problems.length} problems`);
        console.log(`📊 Added ${landing.stepsSection?.steps.length} steps`);
        console.log(`📊 Added ${landing.processSection?.steps.length} process steps`);
        console.log(`📊 Added ${landing.statsSection?.stats.length} stats`);
        console.log('\n🌐 View at: https://seplitza.github.io/rejuvena/landing/omolodis-stage-7-2280');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('👋 Disconnected from MongoDB');
    }
}
populateLandingSections();
