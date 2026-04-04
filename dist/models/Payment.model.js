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
const PaymentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    alfaBankOrderId: {
        type: String,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: '643', // RUB
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
        required: true,
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'sbp', 'unknown'],
        default: 'unknown',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    paymentUrl: {
        type: String
    },
    errorCode: {
        type: String
    },
    errorMessage: {
        type: String
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});
// Индексы для быстрого поиска
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
const Payment = mongoose_1.default.model('Payment', PaymentSchema);
exports.default = Payment;
