"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const LandingSchema = new mongoose_1.Schema({
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
            marathonId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Marathon' },
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
            marathonId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Marathon' },
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
            content: { type: String, default: '' },
            linkText: String,
            linkUrl: String,
            position: { type: String, default: 'hero' }
        }],
    enrollButtons: [{
            text: { type: String, required: true },
            targetId: { type: String, required: true },
            position: { type: String, default: 'hero' }
        }],
    paymentButtons: [{
            text: { type: String, required: true },
            targetId: { type: String, required: true },
            position: { type: String, default: 'hero' }
        }],
    videoBlocks: [{
            title: String,
            videoUrl: { type: String, required: true },
            poster: String,
            order: { type: Number, default: 0 },
            position: { type: String, default: 'hero' }
        }],
    // Публикация
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    showStartDateBlock: {
        type: Boolean,
        default: true // По умолчанию показываем блок
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    strict: false // Разрешаем дополнительные поля (для копий секций типа featuresSection_copy_123)
});
// Индексы для производительности
LandingSchema.index({ slug: 1 });
LandingSchema.index({ isPublished: 1 });
LandingSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('Landing', LandingSchema);
