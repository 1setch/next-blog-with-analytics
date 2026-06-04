import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: '/default-avatar.png'
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    maxlength: 200,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);