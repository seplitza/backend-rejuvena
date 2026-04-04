"use strict";
/**
 * Email Campaign Model
 * Automated email sequences (journeys/flows) for marathons
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
const EmailCampaignSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    trigger: {
        type: {
            type: String,
            enum: ['marathon_enrollment', 'marathon_start', 'marathon_day', 'marathon_completion', 'premium_purchased', 'photo_diary_expiry_7days', 'photo_diary_expiry_3days', 'photo_diary_expiry_1day', 'manual'],
            required: true
        },
        marathonId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Marathon'
        },
        dayNumber: Number
    },
    steps: [{
            id: {
                type: String,
                required: true
            },
            templateId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'EmailTemplate',
                required: true
            },
            delay: {
                type: Number,
                default: 0
            },
            delayUnit: {
                type: String,
                enum: ['hours', 'days'],
                default: 'hours'
            },
            condition: {
                type: {
                    type: String,
                    enum: ['all', 'opened', 'clicked', 'not_opened']
                },
                stepId: String
            },
            position: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 }
            }
        }],
    isActive: {
        type: Boolean,
        default: false
    },
    stats: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        opened: { type: Number, default: 0 },
        clicked: { type: Number, default: 0 },
        bounced: { type: Number, default: 0 },
        unsubscribed: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});
// Index for efficient campaign lookups
EmailCampaignSchema.index({ 'trigger.type': 1, isActive: 1 });
EmailCampaignSchema.index({ 'trigger.marathonId': 1 });
exports.default = mongoose_1.default.model('EmailCampaign', EmailCampaignSchema);
