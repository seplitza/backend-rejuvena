"use strict";
/**
 * Email Template Model
 * Stores customizable email templates for marathon notifications
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
const EmailTemplateSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['enrollment', 'pre_start_reminder', 'start', 'daily_reminder', 'completion', 'photo_diary_7days', 'photo_diary_3days', 'photo_diary_1day'],
        required: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true // Позволяет иметь null/undefined значения без нарушения unique constraint
    },
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    htmlTemplate: {
        type: String,
        required: true
    },
    variables: [{
            type: String
        }],
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    language: {
        type: String,
        enum: ['ru', 'en'],
        default: 'ru'
    },
    category: {
        type: String,
        default: 'marathon'
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('EmailTemplate', EmailTemplateSchema);
