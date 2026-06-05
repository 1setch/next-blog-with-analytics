const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

// Схема Post (упрощенная для миграции)
const PostSchema = new mongoose.Schema({
  title: String,
  slug: String,
  content: String,
  description: String,
  author: mongoose.Schema.Types.ObjectId,
  authorName: String,
  tags: [String],
  views: Number,
  likesCount: Number,
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date,
});

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

async function migratePosts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Находим все посты без статуса или со статусом null/undefined
    const postsToUpdate = await Post.find({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    });

    console.log(`📊 Найдено постов для обновления: ${postsToUpdate.length}`);

    let updatedCount = 0;
    for (const post of postsToUpdate) {
      // Устанавливаем статус "published" для всех существующих постов
      post.status = 'published';
      post.publishedAt = post.createdAt || new Date();
      await post.save();
      updatedCount++;
      console.log(`  ✅ Обновлен пост: "${post.title}" -> статус: published`);
    }

    // Также обновим посты, у которых статус уже есть, но нет publishedAt
    const postsWithoutDate = await Post.find({
      status: 'published',
      publishedAt: { $exists: false }
    });

    console.log(`\n📊 Найдено постов без publishedAt: ${postsWithoutDate.length}`);

    for (const post of postsWithoutDate) {
      post.publishedAt = post.createdAt || new Date();
      await post.save();
      console.log(`  ✅ Добавлена дата публикации для: "${post.title}"`);
    }

    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const draftPosts = await Post.countDocuments({ status: 'draft' });

    console.log('\n' + '='.repeat(50));
    console.log('✅ МИГРАЦИЯ ЗАВЕРШЕНА!');
    console.log('='.repeat(50));
    console.log(`📊 Всего постов: ${totalPosts}`);
    console.log(`📊 Опубликовано: ${publishedPosts}`);
    console.log(`📊 Черновиков: ${draftPosts}`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

migratePosts();