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
const PromoCodeSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: String,
    discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'freeShipping'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    freeShipping: {
        type: Boolean,
        default: false
    },
    minOrderAmount: {
        type: Number,
        min: 0
    },
    maxUses: {
        type: Number,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableProducts: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Product'
        }],
    applicableCategories: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'ProductCategory'
        }],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    source: {
        type: String,
        enum: ['manual', 'fortune_wheel'],
        default: 'manual'
    },
    wheelSpinId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'WheelSpin'
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual field - usageLimit as alias for maxUses
PromoCodeSchema.virtual('usageLimit').get(function () {
    return this.maxUses;
}).set(function (value) {
    this.maxUses = value;
});
// Индексы
PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ isActive: 1, validUntil: 1 });
PromoCodeSchema.index({ validFrom: 1, validUntil: 1 });
exports.default = mongoose_1.default.model('PromoCode', PromoCodeSchema);
