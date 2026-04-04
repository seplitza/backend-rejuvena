"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_model_1 = __importDefault(require("../models/User.model"));
dotenv_1.default.config();
const createEditor = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Check if user already exists
        const existingUser = await User_model_1.default.findOne({ email: 'anastasiya@seplitza.ru' });
        if (existingUser) {
            console.log('⚠️  User anastasiya@seplitza.ru already exists');
            // Update password
            const hashedPassword = await bcryptjs_1.default.hash('1234back', 10);
            existingUser.password = hashedPassword;
            existingUser.role = 'admin';
            await existingUser.save();
            console.log('🔄 Updated password for anastasiya@seplitza.ru');
        }
        else {
            // Create new editor user
            const hashedPassword = await bcryptjs_1.default.hash('1234back', 10);
            const editor = new User_model_1.default({
                email: 'anastasiya@seplitza.ru',
                password: hashedPassword,
                firstName: 'Анастасия',
                role: 'admin'
            });
            await editor.save();
            console.log('👤 Created editor: anastasiya@seplitza.ru');
        }
        console.log('\n✅ Editor account ready!');
        console.log('\n📝 Login credentials:');
        console.log('   Email: anastasiya@seplitza.ru');
        console.log('   Password: 1234back');
        console.log('   Role: admin\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error creating editor:', error);
        process.exit(1);
    }
};
createEditor();
