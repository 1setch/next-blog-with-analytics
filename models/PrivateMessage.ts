import mongoose, { Schema, Document } from 'mongoose';

export interface IPrivateMessage extends Document {
  fromUserId: mongoose.Types.ObjectId;
  fromUsername: string;
  fromAvatar?: string;
  toUserId: mongoose.Types.ObjectId;
  toUsername: string;
  content: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

const PrivateMessageSchema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fromUsername: { type: String, required: true },
  fromAvatar: { type: String, default: '' },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUsername: { type: String, required: true },
  content: { type: String, required: true, maxlength: 500 },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

PrivateMessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });
PrivateMessageSchema.index({ toUserId: 1, read: 1 });

export default mongoose.models.PrivateMessage || mongoose.model<IPrivateMessage>('PrivateMessage', PrivateMessageSchema);