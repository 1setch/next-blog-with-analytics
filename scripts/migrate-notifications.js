const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

// Схема для уведомлений
const NotificationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  sourceId: String,
  sourceSlug: String,
  sourceAuthorId: mongoose.Schema.Types.ObjectId,
  sourceTitle: String,
  read: Boolean,
  createdAt: Date,
});

// Схема для постов
const PostSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  slug: String,
  title: String,
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

async function migrateNotifications() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Находим все уведомления без sourceSlug
    const notifications = await Notification.find({
      $or: [
        { sourceSlug: { $exists: false } },
        { sourceSlug: null },
        { sourceSlug: '' }
      ]
    });

    console.log(`📊 Найдено уведомлений для обновления: ${notifications.length}`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const notification of notifications) {
      let slug = null;
      
      // Если sourceId выглядит как ObjectId (24 hex символа)
      if (notification.sourceId && notification.sourceId.match(/^[0-9a-f]{24}$/)) {
        // Ищем пост по ID
        const post = await Post.findById(notification.sourceId).lean();
        if (post && post.slug) {
          slug = post.slug;
          console.log(`  📝 Найден пост: ${post.slug} для уведомления ${notification._id}`);
        } else {
          console.log(`  ⚠️ Пост не найден для ID: ${notification.sourceId}`);
        }
      } else {
        // Если sourceId уже строка, используем её как slug
        slug = notification.sourceId;
        console.log(`  📝 Используем sourceId как slug: ${slug}`);
      }
      
      if (slug) {
        await Notification.updateOne(
          { _id: notification._id },
          { $set: { sourceSlug: slug } }
        );
        updatedCount++;
        console.log(`  ✅ Обновлено уведомление ${notification._id} -> ${slug}`);
      } else {
        skippedCount++;
        console.log(`  ⚠️ Пропущено уведомление ${notification._id} (нет slug)`);
      }
    }

    // Проверяем результат
    const allNotifications = await Notification.find({});
    const withSlug = await Notification.find({ sourceSlug: { $exists: true, $ne: null, $ne: '' } });
    const withoutSlug = await Notification.find({ 
      $or: [
        { sourceSlug: { $exists: false } },
        { sourceSlug: null },
        { sourceSlug: '' }
      ]
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ МИГРАЦИЯ ЗАВЕРШЕНА!');
    console.log('='.repeat(50));
    console.log(`📊 Всего уведомлений: ${allNotifications.length}`);
    console.log(`📊 С sourceSlug: ${withSlug.length}`);
    console.log(`📊 Без sourceSlug: ${withoutSlug.length}`);
    console.log(`📊 Обновлено: ${updatedCount}`);
    console.log(`📊 Пропущено: ${skippedCount}`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

migrateNotifications();