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
const CommentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    exerciseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Exercise',
        index: true
    },
    marathonId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Marathon',
        index: true
    },
    marathonDayNumber: {
        type: Number,
        min: 1
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    parentCommentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment',
        index: true
    },
    isPrivate: {
        type: Boolean,
        default: false,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'spam'],
        default: 'pending',
        index: true
    },
    priority: {
        type: String,
        enum: ['normal', 'urgent'],
        default: 'normal',
        index: true
    },
    adminResponseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    respondedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    respondedAt: {
        type: Date
    },
    likes: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    starred: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});
// Индексы для быстрого поиска
CommentSchema.index({ exerciseId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ marathonId: 1, marathonDayNumber: 1, status: 1 });
CommentSchema.index({ userId: 1, isPrivate: 1, createdAt: -1 });
CommentSchema.index({ status: 1, priority: 1, createdAt: -1 });
CommentSchema.index({ respondedAt: 1 }); // Для фильтра "ждущие ответа"
exports.default = mongoose_1.default.model('Comment', CommentSchema);
