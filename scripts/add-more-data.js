const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

// Схемы
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  avatar: String,
  bio: String,
  location: String,
  website: String,
  createdAt: Date,
  updatedAt: Date
});

const PostSchema = new mongoose.Schema({
  title: String,
  slug: String,
  content: String,
  description: String,
  author: mongoose.Schema.Types.ObjectId,
  authorName: String,
  tags: [String],
  views: Number,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// 5 новых пользователей
const NEW_USERS = [
  {
    username: 'max_qa',
    email: 'max@example.com',
    password: 'password123',
    bio: 'QA инженер, автоматизирую тестирование',
    location: 'Москва, Россия',
    website: 'https://max.test'
  },
  {
    username: 'julia_ml',
    email: 'julia@example.com',
    password: 'password123',
    bio: 'Machine Learning инженер, нейросети и ИИ',
    location: 'Санкт-Петербург, Россия'
  },
  {
    username: 'andrey_devops',
    email: 'andrey@example.com',
    password: 'password123',
    bio: 'DevOps инженер, Kubernetes и облака',
    location: 'Новосибирск, Россия'
  },
  {
    username: 'ksenia_mobile',
    email: 'ksenia@example.com',
    password: 'password123',
    bio: 'Mobile разработчик, React Native и Flutter',
    location: 'Екатеринбург, Россия'
  },
  {
    username: 'viktor_game',
    email: 'viktor@example.com',
    password: 'password123',
    bio: 'Game developer, Unity и Unreal Engine',
    location: 'Казань, Россия'
  }
];

// 50+ коротких постов на разные темы
const MORE_POSTS = [
  // JavaScript
  { title: 'Замыкания в JavaScript: простое объяснение', tags: ['javascript', 'basics'] },
  { title: 'Event Loop: как работает асинхронность', tags: ['javascript', 'async'] },
  { title: 'Map vs Object: что и когда использовать', tags: ['javascript', 'tips'] },
  { title: 'Деструктуризация в JS на примерах', tags: ['javascript', 'es6'] },
  { title: 'Spread и Rest операторы: полный гайд', tags: ['javascript', 'es6'] },
  
  // React
  { title: 'useMemo vs useCallback: в чем разница?', tags: ['react', 'hooks'] },
  { title: 'React.memo: оптимизация рендеров', tags: ['react', 'performance'] },
  { title: 'Пользовательские хуки: переиспользование логики', tags: ['react', 'hooks'] },
  { title: 'React Context: когда использовать?', tags: ['react', 'state'] },
  { title: 'Порталы в React: модальные окна', tags: ['react', 'patterns'] },
  
  // Next.js
  { title: 'Server Components vs Client Components', tags: ['nextjs', 'react'] },
  { title: 'Динамические роуты в Next.js', tags: ['nextjs', 'routing'] },
  { title: 'Middleware в Next.js: практика', tags: ['nextjs', 'middleware'] },
  { title: 'API Routes в Next.js 14', tags: ['nextjs', 'api'] },
  { title: 'Оптимизация изображений в Next.js', tags: ['nextjs', 'performance'] },
  
  // CSS / Tailwind
  { title: 'Tailwind: кастомные классы', tags: ['tailwind', 'css'] },
  { title: 'Адаптивная верстка на Tailwind', tags: ['tailwind', 'responsive'] },
  { title: 'Темная тема на Tailwind', tags: ['tailwind', 'design'] },
  { title: 'CSS переменные: гайд', tags: ['css', 'custom-properties'] },
  { title: 'Flexbox: полное руководство', tags: ['css', 'flexbox'] },
  
  // TypeScript
  { title: 'Тип any vs unknown в TS', tags: ['typescript', 'types'] },
  { title: 'Дженерики в TypeScript', tags: ['typescript', 'generics'] },
  { title: 'Utility Types: Pick, Omit, Record', tags: ['typescript', 'utils'] },
  { title: 'Type Guards: защита типов', tags: ['typescript', 'type-guards'] },
  { title: 'Declaration Files в TypeScript', tags: ['typescript', 'types'] },
  
  // Базы данных
  { title: 'MongoDB: агрегации на примерах', tags: ['mongodb', 'database'] },
  { title: 'PostgreSQL vs MongoDB: выбор БД', tags: ['database', 'comparison'] },
  { title: 'Индексы в MongoDB: практика', tags: ['mongodb', 'performance'] },
  { title: 'Redis для кэширования', tags: ['redis', 'cache'] },
  { title: 'SQL: JOIN на пальцах', tags: ['sql', 'database'] },
  
  // Инструменты
  { title: 'Git: эффективный workflow', tags: ['git', 'devops'] },
  { title: 'Docker: основы для новичков', tags: ['docker', 'devops'] },
  { title: 'VS Code: лучшие расширения', tags: ['tools', 'vscode'] },
  { title: 'GitHub Actions для CI/CD', tags: ['github', 'ci-cd'] },
  { title: 'Prettier и ESLint: настройка', tags: ['tools', 'linting'] },
  
  // Архитектура
  { title: 'Clean Architecture в вебе', tags: ['architecture', 'patterns'] },
  { title: 'Microservices vs Monolith', tags: ['architecture', 'microservices'] },
  { title: 'DDD: Domain Driven Design', tags: ['architecture', 'ddd'] },
  { title: 'SOLID принципы на примерах', tags: ['patterns', 'oop'] },
  { title: 'Design Patterns: адаптер и мост', tags: ['patterns', 'design'] },
  
  // Карьера
  { title: 'Как проходить собеседования', tags: ['career', 'interview'] },
  { title: 'Топ-10 алгоритмов для подготовки', tags: ['algorithms', 'career'] },
  { title: 'Фриланс vs офис: что выбрать?', tags: ['career', 'advice'] },
  { title: 'Soft skills для разработчика', tags: ['career', 'soft-skills'] },
  { title: 'Как расти до Senior разработчика', tags: ['career', 'growth'] },
  
  // Новое
  { title: 'Квантовые вычисления для программистов', tags: ['future', 'quantum'] },
  { title: 'WebAssembly: что это?', tags: ['wasm', 'web'] },
  { title: 'Без сервера: Serverless', tags: ['serverless', 'cloud'] },
  { title: 'GraphQL против REST: сравнение', tags: ['graphql', 'rest', 'api'] },
  { title: 'PWA: Progressive Web Apps', tags: ['pwa', 'web'] },
  { title: 'WebGL: 3D в браузере', tags: ['webgl', 'graphics'] },
  { title: 'WebRTC: видеочаты в браузере', tags: ['webrtc', 'real-time'] },
  { title: 'HTTP/3 и QUIC: будущее протоколов', tags: ['http', 'network'] },
  { title: 'Rust для веб-разработки?', tags: ['rust', 'webdev'] },
  { title: 'Блокчейн для разработчика', tags: ['blockchain', 'web3'] }
];

// Функция для генерации контента
function generateContent(title) {
  return `${title}! 🚀

Этот пост про ${title.toLowerCase()}.

Практические советы:
1. Начните с малого
2. Изучите документацию
3. Практикуйтесь каждый день
4. Смотрите примеры других разработчиков
5. Задавайте вопросы сообществу

Полезные ресурсы:
• Официальная документация
• Stack Overflow
• GitHub
• YouTube туториалы

Поделитесь своим опытом в комментариях! 💬

#${title.toLowerCase().replace(/\s/g, '')} #webdev`;
}

function generateDescription(title) {
  return `Полный гайд по ${title.toLowerCase()}. Советы, примеры и лучшие практики для начинающих и опытных разработчиков.`;
}

async function addMoreData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Получаем всех существующих пользователей
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} existing users`);

    // Добавляем новых пользователей
    const newUsers = [];
    for (const userData of NEW_USERS) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`👤 User ${userData.username} already exists, skipping...`);
        newUsers.push(existingUser);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          ...userData,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        newUsers.push(user);
        console.log(`✅ Created new user: ${user.username} (${user.email})`);
      }
    }

    // Объединяем всех пользователей
    const allAuthors = [...allUsers, ...newUsers];
    console.log(`\n📝 Total authors: ${allAuthors.length}`);

    // Добавляем посты от всех авторов
    let createdPosts = 0;
    let skippedPosts = 0;

    for (const author of allAuthors) {
      // Каждому автору добавляем 3-6 постов
      const postsForAuthor = Math.floor(Math.random() * 4) + 3; // 3-6 постов
      
      console.log(`\n📝 Creating posts for ${author.username} (${postsForAuthor} posts)...`);
      
      for (let i = 0; i < postsForAuthor; i++) {
        // Берем случайный пост из коллекции
        const postTemplate = MORE_POSTS[Math.floor(Math.random() * MORE_POSTS.length)];
        const slug = postTemplate.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        const uniqueSlug = `${slug}-${author.username}-${Date.now()}-${i}`;
        
        // Проверяем, нет ли уже такого поста
        const existingPost = await Post.findOne({ slug: uniqueSlug });
        
        if (!existingPost) {
          const randomDaysAgo = Math.floor(Math.random() * 60); // За последние 60 дней
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - randomDaysAgo);
          
          const content = generateContent(postTemplate.title);
          const description = generateDescription(postTemplate.title);
          
          await Post.create({
            title: postTemplate.title,
            slug: uniqueSlug,
            content: content,
            description: description,
            tags: postTemplate.tags,
            author: author._id,
            authorName: author.username,
            views: Math.floor(Math.random() * 2000), // 0-2000 просмотров
            createdAt,
            updatedAt: createdAt
          });
          createdPosts++;
          console.log(`  ✅ "${postTemplate.title}" (${postTemplate.tags.join(', ')})`);
        } else {
          skippedPosts++;
        }
      }
    }

    // Общая статистика
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATA ADDITION COMPLETED!');
    console.log('='.repeat(50));
    console.log(`📊 Added users: ${newUsers.length}`);
    console.log(`📊 Added posts: ${createdPosts}`);
    console.log(`📊 Skipped posts: ${skippedPosts}`);
    console.log('-'.repeat(50));
    console.log(`📊 Total users now: ${totalUsers}`);
    console.log(`📊 Total posts now: ${totalPosts}`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addMoreData();