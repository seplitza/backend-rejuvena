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
var mongoose_1 = __importStar(require("mongoose"));
var UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    telegramUsername: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'customer'],
        default: 'customer'
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumEndDate: {
        type: Date
    },
    photoDiaryEndDate: {
        type: Date
    },
    isLegacyUser: {
        type: Boolean,
        default: false
    },
    firstPhotoDiaryUpload: {
        type: Date
    },
    azureUserId: {
        type: String
    },
    lastLoginAt: {
        type: Date
    },
    contactsEnabled: {
        type: Boolean,
        default: true
    },
    // НОВЫЕ ПОЛЯ ДЛЯ SHOP
    phone: {
        type: String
    },
    shippingAddresses: [{
            fullName: String,
            phone: String,
            address: String,
            city: String,
            postalCode: String,
            country: {
                type: String,
                default: 'Россия'
            },
            isDefault: {
                type: Boolean,
                default: false
            }
        }],
    orderCount: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    lastOrderDate: {
        type: Date
    },
    shopCustomerSince: {
        type: Date
    },
    marketingConsent: {
        type: Boolean,
        default: true
    },
    birthDate: {
        type: Date
    },
    // Система скидок
    personalDiscount: {
        type: Number,
        min: 0,
        max: 100
    },
    personalDiscountExpiry: {
        type: Date
    },
    // Предпочитаемые каналы связи
    preferredContactMethod: {
        type: String,
        enum: ['telegram', 'whatsapp', 'viber', 'vk', 'sms', 'email'],
        default: 'email'
    },
    whatsappPhone: {
        type: String
    },
    viberPhone: {
        type: String
    },
    vkUserId: {
        type: String
    },
    // Колесо Фортуны
    fortuneWheelSpins: {
        type: Number,
        default: 0
    },
    fortuneWheelLastSpin: {
        type: Date
    },
    fortuneWheelGifts: [{
            type: {
                type: String,
                enum: ['discount', 'product', 'freeShipping', 'personalDiscount']
            },
            value: mongoose_1.Schema.Types.Mixed,
            description: String,
            expiryDate: Date,
            isUsed: {
                type: Boolean,
                default: false
            },
            usedAt: Date,
            orderId: String
        }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});
exports.default = mongoose_1.default.model('User', UserSchema);
