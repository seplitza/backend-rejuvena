// Shared types for all landing sections

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Problem {
  number: string;
  title: string;
  description: string;
}

export interface Achievement {
  icon: string;
  title: string;
  description: string;
}

export interface Step {
  title: string;
  description: string;
  image?: string;
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  duration: string;
}

export interface Stat {
  value: string;
  label: string;
  description: string;
}

export interface FeaturesSectionData {
  sectionTitle: string;
  subtitle: string;
  features: Feature[];
}

export interface ProblemsSectionData {
  sectionTitle: string;
  subtitle: string;
  problems: Problem[];
}

export interface AboutSectionData {
  sectionTitle: string;
  name: string;
  bio: string;
  photo: string;
  achievements: Achievement[];
}

export interface StepsSectionData {
  sectionTitle: string;
  subtitle: string;
  steps: Step[];
}

export interface ProcessSectionData {
  sectionTitle: string;
  subtitle: string;
  steps: ProcessStep[];
}

export interface StatsSectionData {
  sectionTitle: string;
  stats: Stat[];
}

// Default empty sections для нового лендинга
export const defaultFeatures: FeaturesSectionData = {
  sectionTitle: 'Что такое система Сеплица?',
  subtitle: '4 ступени погружения для достижения естественного омоложения',
  features: [
    { icon: '🏃', title: 'Забота о теле', description: 'Зарядка долголетия за 25 минут и тренировки для увеличения потенциала жизни' },
    { icon: '💆', title: 'Забота о лице и шее', description: 'Практики самомассажа, работа с осанкой и лимфодренажные упражнения' },
    { icon: '🧬', title: 'Клеточное здоровье', description: 'Биохакинг: помощь клеткам в жизнедеятельности, укрепление защитных свойств' },
    { icon: '🦠', title: 'Забота о микробиоме', description: 'Работа с микрофлорой: разнообразное питание, пребиотики и ферментированные продукты' }
  ]
};

export const defaultProblems: ProblemsSectionData = {
  sectionTitle: 'Сеплица стирает возрастные признаки',
  subtitle: 'От 20 до 40 минут в день, чтобы выглядеть моложе',
  problems: [
    { number: '01', title: 'Отеки и птоз лица', description: 'Отек лица, обвисшее верхнее веко, мешки под глазами, брыльки' },
    { number: '02', title: 'Морщины и складки', description: 'Носогубные складки, гусиные лапки, морщины на лбу, кисетные морщины' },
    { number: '03', title: 'Проблемы с осанкой', description: 'Склоненная голова, «шея программиста», холка, проблема с С7' },
    { number: '04', title: 'Пигментация и тонус', description: 'Пигментные пятна, потеря тонуса кожи' }
  ]
};

export const defaultAbout: AboutSectionData = {
  sectionTitle: 'Обо мне',
  name: 'Алексей Пинаев',
  bio: 'Меня зовут Алексей Пинаев, и я создатель системы Сеплица.\n\nМой подход основан на глубоком понимании физиологии, комплексной работе с телом и индивидуальных потребностях каждого человека.',
  photo: 'http://37.252.20.170/uploads/hero/1766750121294-791751151.jpg',
  achievements: [
    { icon: '🎓', title: 'Образование', description: 'Международный институт anti-age медицины' },
    { icon: '⭐', title: 'Опыт', description: '10,000+ довольных последователей' },
    { icon: '📚', title: 'Достижения', description: 'Создатель системы естественного омоложения Сеплица' }
  ]
};

export const defaultSteps: StepsSectionData = {
  sectionTitle: '4 ступени системы Сеплица',
  subtitle: 'Холистический подход к продлению молодости и долголетию',
  steps: [
    { title: '1. Зарядка долголетия', description: '33 упражнения за 25 минут разбудят ток лимфы' },
    { title: '2. Самомассаж лица', description: 'Практики самомассажа, работа с осанкой и лимфодренажные упражнения' },
    { title: '3. Клеточный биохакинг', description: 'Очищение межклеточного вещества, аутофагия, ремонт ДНК' },
    { title: '4. Забота о микробиоме', description: 'Разнообразное питание, пребиотики и ферментированные продукты' }
  ]
};

export const defaultProcess: ProcessSectionData = {
  sectionTitle: 'Как проходит программа',
  subtitle: 'Пошаговый путь к вашему омоложению',
  steps: [
    { number: 1, title: 'Диагностика и анализ', description: 'Комплексное обследование организма', duration: '1-2 дня' },
    { number: 2, title: 'Персональная программа', description: 'Разработка индивидуального плана', duration: '3-5 дней' },
    { number: 3, title: 'Запуск программы', description: 'Начало активной фазы', duration: '21 день' }
  ]
};

export const defaultStats: StatsSectionData = {
  sectionTitle: 'Результаты наших клиентов',
  stats: [
    { value: '-7 лет', label: 'Биологический возраст', description: 'В среднем наши клиенты молодеют на 5-10 лет' },
    { value: '+45%', label: 'Уровень энергии', description: 'Значительное повышение жизненного тонуса' },
    { value: '92%', label: 'Улучшение кожи', description: 'Заметное улучшение состояния кожи' },
    { value: '-12 кг', label: 'Средняя потеря веса', description: 'Нормализация веса без жестких диет' }
  ]
};

// Gallery sections
export interface GalleryImage {
  url: string;
  caption?: string;
  order: number;
  _tempId?: string;
}

export interface ResultsGallerySectionData {
  sectionTitle: string;
  description?: string;
  images: GalleryImage[];
}

export interface TestimonialsGallerySectionData {
  sectionTitle: string;
  description?: string;
  images: GalleryImage[];
}

export const defaultResultsGallery: ResultsGallerySectionData = {
  sectionTitle: 'Результаты наших клиентов',
  description: 'Реальные фотографии до и после работы с системой',
  images: []
};

export const defaultTestimonialsGallery: TestimonialsGallerySectionData = {
  sectionTitle: 'Отзывы клиентов',
  description: 'Что говорят наши клиенты о результатах',
  images: []
};
