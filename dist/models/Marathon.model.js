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
const MarathonSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    paymentDescription: {
        type: String,
        default: ''
    },
    subTitle: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String
    },
    numberOfDays: {
        type: Number,
        required: true,
        default: 14
    },
    cost: {
        type: Number,
        required: true,
        default: 0
    },
    oldPrice: {
        type: Number
    },
    materialAvailabilityDays: {
        type: Number,
        default: 30
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isDisplay: {
        type: Boolean,
        default: false
    },
    isPaid: {
        type: Boolean,
        default: true
    },
    hasContest: {
        type: Boolean,
        default: false
    },
    hasComment: {
        type: Boolean,
        default: false
    },
    autoCrop: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        enum: ['ru', 'en'],
        default: 'ru'
    },
    startDate: {
        type: Date,
        required: true,
        index: true
    },
    contestUploadLastDate: {
        type: Date
    },
    finalistAnnouncementDate: {
        type: Date
    },
    votingLastDate: {
        type: Date
    },
    winnerAnnouncementDate: {
        type: Date
    },
    welcomeMessage: {
        type: String,
        default: ''
    },
    courseDescription: {
        type: String,
        default: ''
    },
    rules: {
        type: String,
        default: ''
    },
    telegramGroupUrl: {
        type: String,
        default: ''
    },
    tenure: {
        type: Number,
        required: true,
        default: 44 // 14 дней обучения + 30 дней практики
    }
}, {
    timestamps: true
});
// Индексы для быстрого поиска
MarathonSchema.index({ startDate: 1, isPublic: 1 });
MarathonSchema.index({ isDisplay: 1 });
const Marathon = mongoose_1.default.model('Marathon', MarathonSchema);
exports.default = Marathon;
