import mongoose, { Schema, Document } from 'mongoose';

// Интерфейсы для секций лендинга
export interface IHeroSection {
  backgroundImage?: string;
  title: string;
  subtitle: string;
  ctaButton: {
    text: string;
    link: string;
  };
}

export interface IMarathonBlock {
  marathonId: mongoose.Types.ObjectId;
  title: string;
  startDate: Date;
  price: number;
  oldPrice?: number;
  duration: string; // например "14 дней обучения + 30 практики"
  features: string[];
  ctaButton: {
    text: string;
    link: string;
  };
}

export interface IMarathonsSection {
  sectionTitle: string;
  basic: IMarathonBlock;
  advanced?: IMarathonBlock;
}

export interface IBenefitsSection {
  sectionTitle: string;
  benefits: Array<{
    icon: string;
    title: string;
    description: string;
    modalId?: number; // Индекс модального окна из detailModals
  }>;
}

export interface ITestimonialsSection {
  sectionTitle: string;
  testimonials: Array<{
    name: string;
    age?: string;
    text: string;
    rating: number;
    image?: string;
  }>;
}

export interface IResultsGallerySection {
  sectionTitle: string;
  description?: string;
  images: Array<{
    url: string;
    caption?: string;
    order: number;
  }>;
}

export interface ITestimonialsGallerySection {
  sectionTitle: string;
  description?: string;
  images: Array<{
    url: string;
    caption?: string;
    order: number;
  }>;
}

export interface ICtaSection {
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage?: string;
}

export interface IFeaturesSection {
  sectionTitle: string;
  subtitle?: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
    modalId?: number; // Индекс модального окна из detailModals
  }>;
}

export interface IProblemsSection {
  sectionTitle: string;
  subtitle?: string;
  problems: Array<{
    number: string;
    title: string;
    description: string;
    modalId?: number; // Индекс модального окна из detailModals
  }>;
}

export interface IAboutSection {
  sectionTitle: string;
  name: string;
  bio: string;
  photo?: string;
  gallery?: string[]; // Галерея дополнительных фото
  achievements: Array<{
    icon: string;
    title: string;
    description: string;
    modalId?: number; // Индекс модального окна из detailModals
  }>;
}

export interface IStepsSection {
  sectionTitle: string;
  subtitle?: string;
  steps: Array<{
    image?: string;
    title: string;
    description: string;
    modalId?: number; // Индекс модального окна из detailModals
  }>;
}

export interface IProcessSection {
  sectionTitle: string;
  subtitle?: string;
  steps: Array<{
    number: number;
    title: string;
    description: string;
    duration?: string;
    modalId?: number; // Индекс модального окна из detailModals
  }>;
}

export interface IStatsSection {
  sectionTitle: string;
  stats: Array<{
    value: string;
    label: string;
    description: string;
    modalId?: number; // Индекс модального окна из detailModals
  }>;
}

export interface ICustomSection {
  type: 'html' | 'markdown';
  content: string;
  order: number;
}

// Модальное окно "Подробнее"
export interface IDetailModal {
  title: string;
  content: string; // HTML или текст
  linkText?: string; // Текст кнопки, если нужна ссылка
  linkUrl?: string; // URL ссылки
}

// Кнопка записи на марафон
export interface IEnrollButton {
  text: string;
  targetId: string; // ID секции для скролла (например 'pricing')
}

// Кнопка оплаты
export interface IPaymentButton {
  text: string;
  targetId: string; // ID секции для скролла
}

// Блок с видео
export interface IVideoBlock {
  title?: string;
  videoUrl: string; // URL видео (YouTube, Vimeo, или прямая ссылка)
  poster?: string; // Превью изображение
  order: number;
}

export interface ILanding extends Document {
  slug: string; // URL идентификатор (например 'marathon-7')
  title: string; // Заголовок страницы
  metaDescription: string; // SEO описание
  ogImage?: string; // Open Graph изображение для соцсетей
  
  // Секции лендинга
  heroSection: IHeroSection;
  featuresSection?: IFeaturesSection; // "Что такое система"
  problemsSection?: IProblemsSection; // "Сеплица стирает возрастные признаки"
  aboutSection?: IAboutSection; // "Обо мне"
  stepsSection?: IStepsSection; // "4 ступени системы"
  processSection?: IProcessSection; // "Как проходит программа"
  statsSection?: IStatsSection; // "Результаты наших клиентов"
  marathonsSection?: IMarathonsSection;
  benefitsSection?: IBenefitsSection;
  testimonialsSection?: ITestimonialsSection;
  resultsGallerySection?: IResultsGallerySection; // Галерея результатов
  testimonialsGallerySection?: ITestimonialsGallerySection; // Галерея отзывов
  ctaSection?: ICtaSection;
  customSections?: ICustomSection[];
  
  // Новые интерактивные элементы
  detailModals?: IDetailModal[]; // До 3 модальных окон "Подробнее"
  enrollButtons?: IEnrollButton[]; // До 3 кнопок "Записаться на марафон"
  paymentButtons?: IPaymentButton[]; // До 2 кнопок "Оплатить сейчас"
  videoBlocks?: IVideoBlock[]; // До 2 видео блоков (карусель если больше 1)
  
  // Статус публикации
  isPublished: boolean;
  publishedAt?: Date;
  
  // Аналитика
  views: number;
  conversions: number;
  
  // Метаданные
  createdBy: mongoose.Types.ObjectId; // Ссылка на User
  createdAt: Date;
  updatedAt: Date;
}

const LandingSchema = new Schema<ILanding>({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  metaDescription: {
    type: String,
    required: true,
    maxlength: 160
  },
  ogImage: {
    type: String
  },
  
  // Hero секция
  heroSection: {
    backgroundImage: String,
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    ctaButton: {
      text: { type: String, required: true },
      link: { type: String, required: true }
    }
  },
  
  // Секция особенностей/преимуществ системы
  featuresSection: {
    sectionTitle: { type: String, default: 'Что такое система Сеплица?' },
    subtitle: String,
    features: [{
      icon: String,
      title: String,
      description: String,
      modalId: Number
    }]
  },
  
  // Секция решаемых проблем
  problemsSection: {
    sectionTitle: { type: String, default: 'Сеплица стирает возрастные признаки' },
    subtitle: String,
    problems: [{
      number: String,
      title: String,
      description: String,
      modalId: Number
    }]
  },
  
  // Секция об авторе/эксперте
  aboutSection: {
    sectionTitle: { type: String, default: 'Обо мне' },
    name: String,
    bio: String,
    photo: String,
    achievements: [{
      icon: String,
      title: String,
      description: String,
      modalId: Number
    }]
  },
  
  // Секция этапов/ступеней системы
  stepsSection: {
    sectionTitle: { type: String, default: '4 ступени системы Сеплица' },
    subtitle: String,
    steps: [{
      image: String,
      title: String,
      description: String,
      modalId: Number
    }]
  },
  
  // Секция процесса прохождения программы
  processSection: {
    sectionTitle: { type: String, default: 'Как проходит программа' },
    subtitle: String,
    steps: [{
      number: Number,
      title: String,
      description: String,
      duration: String,
      modalId: Number
    }]
  },
  
  // Секция статистики/результатов
  statsSection: {
    sectionTitle: { type: String, default: 'Результаты наших клиентов' },
    stats: [{
      value: String,
      label: String,
      description: String,
      modalId: Number
    }]
  },
  
  // Секция с марафонами
  marathonsSection: {
    sectionTitle: { type: String, default: 'Выберите свой уровень' },
    basic: {
      marathonId: { type: Schema.Types.ObjectId, ref: 'Marathon' },
      title: String,
      startDate: Date,
      price: Number,
      oldPrice: Number,
      duration: String,
      features: [String],
      ctaButton: {
        text: String,
        link: String
      }
    },
    advanced: {
      marathonId: { type: Schema.Types.ObjectId, ref: 'Marathon' },
      title: String,
      startDate: Date,
      price: Number,
      oldPrice: Number,
      duration: String,
      features: [String],
      ctaButton: {
        text: String,
        link: String
      }
    }
  },
  
  // Секция преимуществ
  benefitsSection: {
    sectionTitle: { type: String, default: 'Почему выбирают нас' },
    benefits: [{
      icon: String,
      title: String,
      description: String,
      modalId: Number
    }]
  },
  
  // Секция отзывов
  testimonialsSection: {
    sectionTitle: { type: String, default: 'Отзывы наших участников' },
    testimonials: [{
      name: String,
      age: String,
      text: String,
      rating: { type: Number, min: 1, max: 5, default: 5 },
      image: String
    }]
  },
  
  // Call-to-Action секция
  ctaSection: {
    title: String,
    subtitle: String,
    buttonText: String,
    buttonLink: String,
    backgroundImage: String
  },
  
  // Кастомные секции (HTML/Markdown)
  customSections: [{
    type: { type: String, enum: ['html', 'markdown'] },
    content: String,
    order: Number
  }],
  
  // Галерея результатов
  resultsGallerySection: {
    sectionTitle: { type: String, default: 'Результаты наших клиентов' },
    description: String,
    images: [{
      url: String,
      caption: String,
      order: { type: Number, default: 0 }
    }]
  },
  
  // Галерея отзывов
  testimonialsGallerySection: {
    sectionTitle: { type: String, default: 'Отзывы клиентов' },
    description: String,
    images: [{
      url: String,
      caption: String,
      order: { type: Number, default: 0 }
    }]
  },
  
  // Интерактивные элементы
  detailModals: [{
    title: { type: String, required: true },
    content: { 
      type: String, 
      required: [true, 'Контент модального окна обязателен. Добавьте текст или удалите это модальное окно.'],
      validate: {
        validator: function(v: string) {
          // Убираем HTML теги и проверяем что остался текст
          const textOnly = v.replace(/<[^>]*>/g, '').trim();
          if (textOnly.length === 0) {
            return false;
          }
          return true;
        },
        message: 'Модальное окно содержит только HTML теги без текста. Добавьте текст или удалите это модальное окно.'
      }
    },
    linkText: String,
    linkUrl: String
  }],
  
  enrollButtons: [{
    text: { type: String, required: true },
    targetId: { type: String, required: true }
  }],
  
  paymentButtons: [{
    text: { type: String, required: true },
    targetId: { type: String, required: true }
  }],
  
  videoBlocks: [{
    title: String,
    videoUrl: { type: String, required: true },
    poster: String,
    order: { type: Number, default: 0 }
  }],
  
  // Публикация
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  
  // Аналитика
  views: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  
  // Метаданные
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  strict: false  // Разрешаем дополнительные поля (для копий секций типа featuresSection_copy_123)
});

// Индексы для производительности
LandingSchema.index({ slug: 1 });
LandingSchema.index({ isPublished: 1 });
LandingSchema.index({ createdAt: -1 });

export default mongoose.model<ILanding>('Landing', LandingSchema);
