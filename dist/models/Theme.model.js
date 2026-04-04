"use strict";
/**
 * Theme Model
 * Manages color themes for the application
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
const ThemeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    isDark: {
        type: Boolean,
        default: false,
    },
    colors: {
        primary: {
            type: String,
            required: true,
            default: '#7c3aed', // purple-600
        },
        secondary: {
            type: String,
            required: true,
            default: '#ec4899', // pink-500
        },
        accent: {
            type: String,
            required: true,
            default: '#f97316', // orange-500
        },
        background: {
            type: String,
            required: true,
            default: '#ffffff',
        },
        surface: {
            type: String,
            required: true,
            default: '#f9fafb', // gray-50
        },
        text: {
            type: String,
            required: true,
            default: '#111827', // gray-900
        },
        textSecondary: {
            type: String,
            required: true,
            default: '#6b7280', // gray-500
        },
    },
    gradients: {
        primary: {
            type: String,
            default: 'from-purple-600 to-pink-600',
        },
        secondary: {
            type: String,
            default: 'from-orange-500 to-pink-500',
        },
        background: {
            type: String,
            default: 'from-pink-50 to-purple-50',
        },
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
// Ensure only one default theme
ThemeSchema.pre('save', async function (next) {
    if (this.isDefault) {
        await mongoose_1.default.model('Theme').updateMany({ _id: { $ne: this._id } }, { $set: { isDefault: false } });
    }
    next();
});
// Index for slug
ThemeSchema.index({ slug: 1 });
ThemeSchema.index({ isActive: 1, order: 1 });
const Theme = mongoose_1.default.model('Theme', ThemeSchema);
exports.default = Theme;
