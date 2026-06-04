import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  slug: string;
  content: string;
  description: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  tags: string[];
  views: number;
  likesCount: number;
  status: 'draft' | 'published'; // ← добавляем статус
  publishedAt?: Date; // ← дата публикации
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 200 
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  tags: [{ 
    type: String,
    trim: true 
  }],
  views: { 
    type: Number, 
    default: 0 
  },
  likesCount: { 
    type: Number, 
    default: 0 
  },
  status: {  // ← добавляем
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  publishedAt: {  // ← добавляем
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

PostSchema.index({ title: 'text', content: 'text' });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);