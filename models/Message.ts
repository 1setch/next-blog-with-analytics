import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  username: string;
  userId?: mongoose.Types.ObjectId;
  avatar?: string;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema({
  username: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  avatar: { type: String, default: '' },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

MessageSchema.index({ createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);