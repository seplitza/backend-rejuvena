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
var OrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [{
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            productName: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }],
    tags: [{
            type: String,
            trim: true
        }],
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: String,
        country: {
            type: String,
            default: 'Россия'
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingCost: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    promoCode: String,
    promoDiscount: Number,
    personalDiscount: Number,
    wheelGiftId: String,
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    statusHistory: [{
            status: String,
            timestamp: { type: Date, default: Date.now },
            notes: String
        }],
    paymentStatus: {
        type: String,
        enum: ['awaiting_payment', 'pending', 'completed', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cash', 'card']
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    shippingMethod: {
        type: String,
        enum: ['cdek_courier', 'cdek_pickup', 'cdek_postamat', 'courier', 'pickup', 'cdek'],
        required: true
    },
    fortuneWheelGifts: [{
            giftId: mongoose_1.Schema.Types.ObjectId,
            description: String,
            discount: Number
        }],
    notes: String,
    contactMethod: {
        type: String,
        enum: ['phone', 'telegram', 'whatsapp', 'viber', 'vk']
    },
    cdekOrderId: String,
    cdekTrackingNumber: String,
    cdekBarcode: String,
    cdekOfficeCode: String,
    cdekOfficeName: String,
    cdekOfficeAddress: String,
    estimatedDeliveryDate: Date,
    paidAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual fields as aliases
OrderSchema.virtual('user').get(function () {
    return this.userId;
}).set(function (value) {
    this.userId = value;
});
OrderSchema.virtual('totalAmount').get(function () {
    return this.total;
}).set(function (value) {
    this.total = value;
});
OrderSchema.virtual('deliveryMethod').get(function () {
    return this.shippingMethod;
}).set(function (value) {
    this.shippingMethod = value;
});
// Индексы
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ cdekOrderId: 1 });
exports.default = mongoose_1.default.model('Order', OrderSchema);
