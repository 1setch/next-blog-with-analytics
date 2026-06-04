import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);