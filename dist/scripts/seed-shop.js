"use strict";
/**
 * Seed Script - Populate Shop with test data
 * Run: npm run seed-shop
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const ProductCategory_model_1 = __importDefault(require("../models/ProductCategory.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const PromoCode_model_1 = __importDefault(require("../models/PromoCode.model"));
const FortuneWheelPrize_model_1 = __importDefault(require("../models/FortuneWheelPrize.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
dotenv_1.default.config();
async function seedShop() {
    try {
        console.log('🌱 Starting Shop seed...');
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Clear existing shop data
        console.log('🗑️  Clearing existing shop data...');
        await ProductCategory_model_1.default.deleteMany({});
        await Product_model_1.default.deleteMany({});
        await PromoCode_model_1.default.deleteMany({});
        await FortuneWheelPrize_model_1.default.deleteMany({});
        // Create categories
        console.log('📁 Creating categories...');
        const beautyCategory = await ProductCategory_model_1.default.create({
            name: 'Косметика',
            slug: 'beauty',
            description: 'Косметика для лица и тела',
            sortOrder: 1,
            isActive: true
        });
        const supplementsCategory = await ProductCategory_model_1.default.create({
            name: 'Витамины и добавки',
            slug: 'supplements',
            description: 'Витамины и биологически активные добавки',
            sortOrder: 2,
            isActive: true
        });
        const accessoriesCategory = await ProductCategory_model_1.default.create({
            name: 'Аксессуары',
            slug: 'accessories',
            description: 'Аксессуары для красоты и здоровья',
            sortOrder: 3,
            isActive: true
        });
        // Create subcategories
        const faceCategory = await ProductCategory_model_1.default.create({
            name: 'Уход за лицом',
            slug: 'face-care',
            parentCategory: beautyCategory._id,
            sortOrder: 1,
            isActive: true
        });
        console.log(`✅ Created ${await ProductCategory_model_1.default.countDocuments()} categories`);
        // Create products
        console.log('🛍️  Creating products...');
        const products = [
            {
                sku: 'SERUM-001',
                name: 'Антивозрастная сыворотка с ретинолом',
                description: 'Эффективная сыворотка для борьбы с возрастными изменениями кожи. Содержит ретинол 0.5%.',
                price: 2490,
                oldPrice: 3200,
                stock: 50,
                category: faceCategory._id,
                images: [
                    'https://picsum.photos/seed/serum1/400/400',
                    'https://picsum.photos/seed/serum2/400/400'
                ],
                articleWB: '123456789', // Example WB article
                weight: 50,
                dimensions: { length: 10, width: 3, height: 15 },
                manufacturer: 'BeautyLab',
                countryOfOrigin: 'Южная Корея',
                tags: ['антивозрастной уход', 'ретинол', 'сыворотка'],
                seo: {
                    metaTitle: 'Антивозрастная сыворотка с ретинолом | Seplitza',
                    metaDescription: 'Купить антивозрастную сыворотку с ретинолом 0.5%'
                },
                isActive: true
            },
            {
                sku: 'CREAM-001',
                name: 'Увлажняющий крем с гиалуроновой кислотой',
                description: 'Глубокое увлажнение кожи благодаря 3 видам гиалуроновой кислоты',
                price: 1890,
                oldPrice: 2500,
                stock: 75,
                category: faceCategory._id,
                images: [
                    'https://picsum.photos/seed/cream1/400/400'
                ],
                skuOzon: '987654321', // Example Ozon SKU
                weight: 75,
                dimensions: { length: 8, width: 8, height: 6 },
                manufacturer: 'SkinCare Pro',
                countryOfOrigin: 'Франция',
                tags: ['увлажнение', 'гиалуроновая кислота', 'крем'],
                isActive: true
            },
            {
                sku: 'BUNDLE-001',
                name: 'Набор "Идеальная кожа" (сыворотка + крем)',
                description: 'Комплексный уход: антивозрастная сыворотка + увлажняющий крем',
                price: 3990,
                oldPrice: 5700,
                stock: 30,
                category: faceCategory._id,
                images: [
                    'https://picsum.photos/seed/bundle1/400/400'
                ],
                isBundle: true,
                bundleItems: [], // Will be populated after product creation
                weight: 125,
                dimensions: { length: 20, width: 15, height: 8 },
                tags: ['набор', 'комплект', 'выгодно'],
                isActive: true
            },
            {
                sku: 'VIT-C-001',
                name: 'Витамин C 1000мг',
                description: 'Витамин C в капсулах для поддержки иммунитета и молодости кожи',
                price: 890,
                stock: 100,
                category: supplementsCategory._id,
                images: [
                    'https://picsum.photos/seed/vitc1/400/400'
                ],
                articleWB: '111222333',
                weight: 100,
                manufacturer: 'VitaMax',
                countryOfOrigin: 'США',
                tags: ['витамины', 'витамин C', 'иммунитет'],
                isActive: true
            },
            {
                sku: 'ROLLER-001',
                name: 'Роллер для лица из розового кварца',
                description: 'Массажный роллер для лимфодренажа и улучшения тонуса кожи',
                price: 1290,
                oldPrice: 1800,
                stock: 40,
                category: accessoriesCategory._id,
                images: [
                    'https://picsum.photos/seed/roller1/400/400'
                ],
                skuOzon: '555666777',
                weight: 150,
                dimensions: { length: 15, width: 5, height: 3 },
                manufacturer: 'BeautyTools',
                countryOfOrigin: 'Китай',
                tags: ['массаж', 'роллер', 'кварц'],
                isActive: true
            }
        ];
        const createdProducts = await Product_model_1.default.insertMany(products);
        // Update bundle with actual product IDs
        const serumProduct = createdProducts[0];
        const creamProduct = createdProducts[1];
        const bundleProduct = createdProducts[2];
        bundleProduct.bundleItems = [
            { productId: serumProduct._id, quantity: 1 },
            { productId: creamProduct._id, quantity: 1 }
        ];
        await bundleProduct.save();
        console.log(`✅ Created ${createdProducts.length} products`);
        // Create promo codes
        console.log('🎟️  Creating promo codes...');
        const promoCodes = [
            {
                code: 'WELCOME10',
                description: 'Скидка 10% на первый заказ',
                discountType: 'percentage',
                discountValue: 10,
                usageLimit: 1000,
                isActive: true
            },
            {
                code: 'FREESHIP',
                description: 'Бесплатная доставка',
                discountType: 'freeShipping',
                discountValue: 0,
                freeShipping: true,
                minOrderAmount: 3000,
                isActive: true
            },
            {
                code: 'SAVE500',
                description: 'Скидка 500₽ на заказ от 5000₽',
                discountType: 'fixed',
                discountValue: 500,
                minOrderAmount: 5000,
                usageLimit: 50,
                validUntil: new Date('2026-12-31'),
                isActive: true
            },
            {
                code: 'SKINCARE20',
                description: 'Скидка 20% на уход за лицом',
                discountType: 'percentage',
                discountValue: 20,
                applicableCategories: [faceCategory._id],
                validUntil: new Date('2026-06-30'),
                isActive: true
            }
        ];
        await PromoCode_model_1.default.insertMany(promoCodes);
        console.log(`✅ Created ${promoCodes.length} promo codes`);
        // Create Fortune Wheel prizes
        console.log('🎡 Creating Fortune Wheel prizes...');
        const prizes = [
            {
                name: 'Скидка 5%',
                description: 'Скидка 5% на следующий заказ',
                prizeType: 'discount',
                discountPercent: 5,
                probability: 30, // 30% chance
                imageUrl: 'https://picsum.photos/seed/prize1/200/200',
                isActive: true
            },
            {
                name: 'Скидка 10%',
                description: 'Скидка 10% на следующий заказ',
                prizeType: 'discount',
                discountPercent: 10,
                probability: 20,
                imageUrl: 'https://picsum.photos/seed/prize2/200/200',
                isActive: true
            },
            {
                name: 'Скидка 15%',
                description: 'Скидка 15% на следующий заказ',
                prizeType: 'discount',
                discountPercent: 15,
                probability: 15,
                imageUrl: 'https://picsum.photos/seed/prize3/200/200',
                isActive: true
            },
            {
                name: 'Скидка 20%',
                description: 'Скидка 20% на следующий заказ',
                prizeType: 'discount',
                discountPercent: 20,
                probability: 10,
                imageUrl: 'https://picsum.photos/seed/prize4/200/200',
                isActive: true
            },
            {
                name: 'Бесплатная доставка',
                description: 'Бесплатная доставка на следующий заказ',
                prizeType: 'freeShipping',
                probability: 15,
                imageUrl: 'https://picsum.photos/seed/prize5/200/200',
                isActive: true
            },
            {
                name: 'Витамин C в подарок',
                description: 'Бесплатная упаковка Витамина C',
                prizeType: 'freeProduct',
                freeProductId: createdProducts[3]._id, // Vitamin C product
                probability: 8,
                imageUrl: 'https://picsum.photos/seed/prize6/200/200',
                isActive: true
            },
            {
                name: 'Попробуй ещё',
                description: 'В этот раз не повезло, но не сдавайся!',
                prizeType: 'noWin',
                probability: 2,
                imageUrl: 'https://picsum.photos/seed/prize7/200/200',
                isActive: true
            }
        ];
        await FortuneWheelPrize_model_1.default.insertMany(prizes);
        console.log(`✅ Created ${prizes.length} Fortune Wheel prizes`);
        // Grant Fortune Wheel spins to all existing users
        console.log('🎁 Granting Fortune Wheel spins to existing users...');
        const updateResult = await User_model_1.default.updateMany({}, {
            $set: { fortuneWheelSpins: 3 } // Give 3 free spins
        });
        console.log(`✅ Updated ${updateResult.modifiedCount} users`);
        console.log('\n✨ Shop seed completed successfully!');
        console.log(`
📊 Summary:
- Categories: ${await ProductCategory_model_1.default.countDocuments()}
- Products: ${await Product_model_1.default.countDocuments()}
- Promo Codes: ${await PromoCode_model_1.default.countDocuments()}
- Fortune Wheel Prizes: ${await FortuneWheelPrize_model_1.default.countDocuments()}
- Users with spins: ${updateResult.modifiedCount}
    `);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding shop:', error);
        process.exit(1);
    }
}
// Run seed
seedShop();
