"use strict";
/**
 * Offer Model
 * Manages promotional offers displayed on homepage carousel
 * Supports Premium, Marathon, and Exercise offers
 */
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
const offerSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['premium', 'marathon', 'exercise'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    subtitle: String,
    description: String,
    badge: String,
    badgeColor: String,
    gradient: {
        from: String,
        to: String,
    },
    borderColor: String,
    imagePath: String,
    marathonId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Marathon',
    },
    exerciseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Exercise',
    },
    features: [
        {
            title: String,
            description: String,
        },
    ],
    price: Number,
    priceLabel: String,
    isVisible: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    showToLoggedIn: {
        type: Boolean,
        default: true,
    },
    showToGuests: {
        type: Boolean,
        default: true,
    },
    hiddenIfOwned: {
        type: Boolean,
        default: true,
    },
    buttonText: String,
}, {
    timestamps: true,
});
// Index for efficient sorting
offerSchema.index({ order: 1, createdAt: -1 });
offerSchema.index({ type: 1, isVisible: 1 });
exports.default = mongoose_1.default.model('Offer', offerSchema);
