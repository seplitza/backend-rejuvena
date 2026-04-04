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
const ProductSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    images: [{
            type: String
        }],
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ProductCategory',
        required: true
    },
    tags: [{
            type: String
        }],
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isBundle: {
        type: Boolean,
        default: false
    },
    bundleItems: [{
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: {
                type: Number,
                min: 1
            }
        }],
    // Порядок товара для сортировки
    order: {
        type: Number,
        default: 0,
        index: true
    },
    // Общие характеристики
    brand: String,
    manufacturer: String,
    countryOfOrigin: String,
    barcode: String,
    vendorCode: String,
    weight: Number,
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    characteristics: [{
            name: String,
            value: String
        }],
    // Wildberries
    wildberries: {
        nmId: String,
        url: String,
        price: Number,
        sizes: [{
                techSize: String,
                wbSize: String
            }]
    },
    // Ozon
    ozon: {
        sku: String,
        fboSku: String,
        fbsSku: String,
        url: String,
        price: Number,
        categoryId: Number
    },
    // Yandex Market
    yandexMarket: {
        sku: String,
        url: String,
        price: Number,
        shopSku: String,
        warranty: String
    },
    // Avito
    avito: {
        id: String,
        url: String,
        price: Number,
        condition: {
            type: String,
            enum: ['new', 'used']
        },
        address: String
    },
    // Direct marketplace fields (legacy)
    articleWB: String,
    skuOzon: String,
    lastPrice: Number,
    lastChecked: Date,
    // Legacy nested format
    marketplaces: {
        wildberries: {
            url: String,
            articleWB: String,
            lastPrice: Number,
            lastChecked: Date
        },
        ozon: {
            url: String,
            skuOzon: String,
            lastPrice: Number,
            lastChecked: Date
        }
    },
    metadata: {
        seoTitle: String,
        seoDescription: String,
        ingredients: String,
        usage: String,
        contraindications: String,
        certifications: [String]
    },
    seo: {
        metaTitle: String,
        metaDescription: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual field - oldPrice as alias for compareAtPrice
ProductSchema.virtual('oldPrice').get(function () {
    return this.compareAtPrice;
}).set(function (value) {
    this.compareAtPrice = value;
});
// Индексы
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ 'marketplaces.wildberries.articleWB': 1 });
ProductSchema.index({ 'marketplaces.ozon.skuOzon': 1 });
exports.default = mongoose_1.default.model('Product', ProductSchema);
