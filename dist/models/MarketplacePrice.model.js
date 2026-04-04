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
const MarketplacePriceSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    marketplace: {
        type: String,
        enum: ['wildberries', 'ozon'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPrice: {
        type: Number,
        min: 0
    },
    inStock: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    reviewsCount: {
        type: Number,
        min: 0
    },
    url: {
        type: String,
        required: true
    },
    fetchedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
// Индексы
MarketplacePriceSchema.index({ productId: 1, marketplace: 1, createdAt: -1 });
// TTL индекс: удалять записи старше 30 дней
MarketplacePriceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
// Виртуальные поля для совместимости с API
MarketplacePriceSchema.virtual('product').get(function () {
    return this.productId;
});
MarketplacePriceSchema.virtual('available').get(function () {
    return this.inStock;
});
// Включаем виртуальные поля в JSON и объекты
MarketplacePriceSchema.set('toJSON', { virtuals: true });
MarketplacePriceSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('MarketplacePrice', MarketplacePriceSchema);
