"use strict";
/**
 * Email Log Model
 * Tracks individual email sends for analytics
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
const EmailLogSchema = new mongoose_1.Schema({
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'EmailCampaign',
        required: true
    },
    stepId: {
        type: String,
        required: true
    },
    templateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'EmailTemplate',
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'bounced', 'failed'],
        default: 'sent'
    },
    provider: {
        type: String,
        default: 'resend'
    },
    providerId: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    bouncedAt: Date,
    unsubscribedAt: Date,
    error: String
}, {
    timestamps: true
});
// Indexes for analytics queries
EmailLogSchema.index({ campaignId: 1, sentAt: -1 });
EmailLogSchema.index({ userId: 1 });
EmailLogSchema.index({ email: 1 });
EmailLogSchema.index({ status: 1, sentAt: -1 });
exports.default = mongoose_1.default.model('EmailLog', EmailLogSchema);
