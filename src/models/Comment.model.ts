import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  userId: mongoose.Types.ObjectId;
  exerciseId?: mongoose.Types.ObjectId;
  marathonId?: mongoose.Types.ObjectId;
  marathonDayNumber?: number;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId; // Для цепочки ответов
  isPrivate: boolean; // Личная переписка с тренером
  
  // Модерация
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  priority: 'normal' | 'urgent'; // Горящие = urgent
  
  // Ответ админа
  adminResponseId?: mongoose.Types.ObjectId; // ID комментария с ответом
  respondedBy?: mongoose.Types.ObjectId; // Кто ответил
  respondedAt?: Date;
  
  // Метаданные
  likes: number;
  isEdited: boolean;
  editedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
      index: true
    },
    marathonId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
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
    }
  },
  {
    timestamps: true
  }
);

// Индексы для быстрого поиска
CommentSchema.index({ exerciseId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ marathonId: 1, marathonDayNumber: 1, status: 1 });
CommentSchema.index({ userId: 1, isPrivate: 1, createdAt: -1 });
CommentSchema.index({ status: 1, priority: 1, createdAt: -1 });
CommentSchema.index({ respondedAt: 1 }); // Для фильтра "ждущие ответа"

export default mongoose.model<IComment>('Comment', CommentSchema);
