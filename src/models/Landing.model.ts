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
  }>;
}

export interface IProblemsSection {
  sectionTitle: string;
  subtitle?: string;
  problems: Array<{
    number: string;
    title: string;
    description: string;
  }>;
}

export interface IAboutSection {
  sectionTitle: string;
  name: string;
  bio: string;
  photo?: string;
  achievements: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export interface IStepsSection {
  sectionTitle: string;
  subtitle?: string;
  steps: Array<{
    image?: string;
    title: string;
    description: string;
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
  }>;
}

export interface IStatsSection {
  sectionTitle: string;
  stats: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

export interface ICustomSection {
  type: 'html' | 'markdown';
  content: string;
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
  ctaSection?: ICtaSection;
  customSections?: ICustomSection[];
  
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
      description: String
    }]
  },
  
  // Секция решаемых проблем
  problemsSection: {
    sectionTitle: { type: String, default: 'Сеплица стирает возрастные признаки' },
    subtitle: String,
    problems: [{
      number: String,
      title: String,
      description: String
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
      description: String
    }]
  },
  
  // Секция этапов/ступеней системы
  stepsSection: {
    sectionTitle: { type: String, default: '4 ступени системы Сеплица' },
    subtitle: String,
    steps: [{
      image: String,
      title: String,
      description: String
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
      duration: String
    }]
  },
  
  // Секция статистики/результатов
  statsSection: {
    sectionTitle: { type: String, default: 'Результаты наших клиентов' },
    stats: [{
      value: String,
      label: String,
      description: String
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
      description: String
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
  timestamps: true
});

// Индексы для производительности
LandingSchema.index({ slug: 1 });
LandingSchema.index({ isPublished: 1 });
LandingSchema.index({ createdAt: -1 });

export default mongoose.model<ILanding>('Landing', LandingSchema);
