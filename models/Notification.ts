import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'comment' | 'like' | 'reply';
  sourceId: string;  // Может быть slug или ObjectId
  sourceSlug?: string; // Добавляем поле для slug поста
  sourceAuthorId: mongoose.Types.ObjectId;
  sourceTitle?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['comment', 'like', 'reply'], required: true },
  sourceId: { type: String, required: true }, // Теперь строка
  sourceSlug: { type: String }, // Slug поста для ссылки
  sourceAuthorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sourceTitle: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);