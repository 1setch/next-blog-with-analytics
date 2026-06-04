const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const LikeSchema = new mongoose.Schema({
  postId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId
});

const PostSchema = new mongoose.Schema({
  likesCount: Number
});

const Like = mongoose.models.Like || mongoose.model('Like', LikeSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const posts = await Post.find({});
    
    for (const post of posts) {
      const likesCount = await Like.countDocuments({ postId: post._id });
      await Post.updateOne({ _id: post._id }, { likesCount });
      console.log(`📊 Post ${post._id}: ${likesCount} likes`);
    }
    
    console.log('✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrate();