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
async function createAdmin() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/rejuvena');
        console.log('✓ Connected to MongoDB');
        const email = 'Seplitza@gmail.com';
        const password = '1234back';
        // Проверка, существует ли уже пользователь
        const existingUser = await User_model_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log(`User ${email} already exists. Updating role to superadmin...`);
            existingUser.role = 'superadmin';
            existingUser.firstName = 'Admin';
            existingUser.lastName = 'Rejuvena';
            await existingUser.save();
            console.log(`✓ User ${email} updated to superadmin`);
        }
        else {
            // Хешируем пароль
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // Создаем админа
            const admin = new User_model_1.default({
                email: email.toLowerCase(),
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'Rejuvena',
                role: 'superadmin',
                createdAt: new Date()
            });
            await admin.save();
            console.log(`✓ Admin user created successfully`);
            console.log(`  Email: ${email}`);
            console.log(`  Password: ${password}`);
        }
        await mongoose_1.default.disconnect();
        console.log('✓ Disconnected from MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('✗ Error creating admin:', error);
        process.exit(1);
    }
}
createAdmin();
