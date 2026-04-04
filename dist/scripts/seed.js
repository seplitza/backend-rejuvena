"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Tag_model_1 = __importDefault(require("../models/Tag.model"));
dotenv_1.default.config();
const seed = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Clear existing data
        await User_model_1.default.deleteMany({});
        await Tag_model_1.default.deleteMany({});
        console.log('🗑️  Cleared existing data');
        // Create superadmin
        const hashedPassword = await bcryptjs_1.default.hash('1234back', 10);
        const superadmin = new User_model_1.default({
            email: 'seplitza@gmail.com',
            password: hashedPassword,
            role: 'superadmin'
        });
        await superadmin.save();
        console.log('👤 Created superadmin: seplitza@gmail.com');
        // Create default tags
        const defaultTags = [
            { name: 'Начинающий', slug: 'beginner', color: '#10B981' },
            { name: 'Продвинутый', slug: 'advanced', color: '#F59E0B' },
            { name: 'Эксперт', slug: 'expert', color: '#EF4444' },
            { name: 'Йога', slug: 'yoga', color: '#8B5CF6' },
            { name: 'Пилатес', slug: 'pilates', color: '#EC4899' },
            { name: 'Растяжка', slug: 'stretching', color: '#06B6D4' }
        ];
        for (const tagData of defaultTags) {
            const tag = new Tag_model_1.default(tagData);
            await tag.save();
        }
        console.log('🏷️  Created default tags');
        console.log('\n✅ Seeding completed successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Email: seplitza@gmail.com');
        console.log('   Password: 1234back\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};
seed();
