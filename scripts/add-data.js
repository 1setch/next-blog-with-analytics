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

// Пользователи для добавления
const USERS = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    bio: 'Администратор блога',
    location: 'Москва, Россия',
  },
  {
    username: 'alex_developer',
    email: 'alex@example.com',
    password: 'password123',
    bio: 'Full-stack разработчик, люблю React и Node.js',
    location: 'Москва, Россия',
    website: 'https://alex.dev',
  },
  {
    username: 'maria_designer',
    email: 'maria@example.com',
    password: 'password123',
    bio: 'UI/UX дизайнер, создаю красивые интерфейсы',
    location: 'Санкт-Петербург, Россия',
    website: 'https://maria.design',
  },
  {
    username: 'ivan_blogger',
    email: 'ivan@example.com',
    password: 'password123',
    bio: 'Технический блогер, пишу о IT и технологиях',
    location: 'Новосибирск, Россия',
    website: 'https://ivan.blog',
  },
  {
    username: 'elena_teacher',
    email: 'elena@example.com',
    password: 'password123',
    bio: 'Преподаватель программирования, обучаю начинающих',
    location: 'Екатеринбург, Россия',
  },
  {
    username: 'pavel_startup',
    email: 'pavel@example.com',
    password: 'password123',
    bio: 'Основатель стартапа, пишу о бизнесе и технологиях',
    location: 'Казань, Россия',
    website: 'https://pavel.startup',
  },
  {
    username: 'olga_ai',
    email: 'olga@example.com',
    password: 'password123',
    bio: 'Исследователь AI, пишу о нейросетях',
    location: 'Санкт-Петербург, Россия',
  },
  {
    username: 'dmitry_backend',
    email: 'dmitry@example.com',
    password: 'password123',
    bio: 'Backend разработчик, эксперт по базам данных',
    location: 'Новосибирск, Россия',
  },
  {
    username: 'anna_frontend',
    email: 'anna@example.com',
    password: 'password123',
    bio: 'Frontend разработчик, люблю CSS и анимации',
    location: 'Екатеринбург, Россия',
  },
  {
    username: 'sergey_php',
    email: 'sergey@example.com',
    password: 'password123',
    bio: 'PHP разработчик, автор книг по Laravel',
    location: 'Казань, Россия',
  }
];

// Короткие посты на разные темы
const POSTS = [
  {
    title: 'useEffect: полное руководство',
    content: 'useEffect - самый важный хук в React. Он позволяет выполнять побочные эффекты в функциональных компонентах. Заменяет lifecycle методы componentDidMount, componentDidUpdate и componentWillUnmount.',
    description: 'Глубокое погружение в useEffect React хука',
    tags: ['react', 'hooks', 'javascript']
  },
  {
    title: '10 npm пакетов для ускорения разработки',
    content: '1. lodash - утилиты для массивов и объектов\n2. axios - HTTP клиент\n3. date-fns - работа с датами\n4. zod - валидация\n5. clsx - условные классы\n6. bcrypt - хеширование\n7. jsonwebtoken - JWT токены\n8. mongoose - ODM для MongoDB\n9. redux-toolkit - управление состоянием\n10. formik - формы',
    description: 'Полезные npm пакеты для каждого проекта',
    tags: ['npm', 'javascript', 'tools']
  },
  {
    title: 'CSS Grid vs Flexbox: что выбрать?',
    content: 'Flexbox - для одномерной верстки (ряды или колонки). Grid - для двухмерной (и ряды, и колонки). Используйте Flexbox для компонентов и мелких элементов. Grid для общей структуры страницы.',
    description: 'Сравнение двух технологий верстки',
    tags: ['css', 'frontend', 'webdev']
  },
  {
    title: 'TypeScript: продвинутые типы',
    content: 'Pick, Omit, Partial, Required, Record, Exclude, Extract, NonNullable. Используйте utility types для трансформации типов. Это делает код более типобезопасным и читаемым.',
    description: 'Продвинутые типы TypeScript',
    tags: ['typescript', 'javascript']
  },
  {
    title: 'Как учиться программировать эффективно',
    content: 'Совет 1: Практикуйтесь каждый день\nСовет 2: Решайте задачи на Codewars\nСовет 3: Делайте pet-проекты\nСовет 4: Читайте чужой код\nСовет 5: Участвуйте в open-source\nСовет 6: Напишите свой блог\nСовет 7: Найдите ментора',
    description: 'Советы для быстрого обучения программированию',
    tags: ['education', 'programming', 'career']
  },
  {
    title: 'MongoDB: индексы и производительность',
    content: 'Индексы ускоряют поиск в 100+ раз. Создавайте индексы для полей, по которым часто фильтруете. Составные индексы для нескольких полей. Индексы текста для полнотекстового поиска.',
    description: 'Оптимизация запросов MongoDB',
    tags: ['mongodb', 'database', 'performance']
  },
  {
    title: 'Анимации в CSS без JavaScript',
    content: 'transition - для простых анимаций, animation - для сложных. Используйте keyframes для создания кастомной анимации. transform и opacity анимируются лучше всего (не вызывают reflow).',
    description: 'Создание анимаций с помощью чистого CSS',
    tags: ['css', 'animation', 'frontend']
  },
  {
    title: 'Git: полезные команды для ежедневной работы',
    content: 'git stash - временно сохранить изменения\ngit cherry-pick - перенести коммит\ngit rebase - переписать историю\ngit bisect - найти баг бинарным поиском\ngit reflog - восстановить потерянные коммиты',
    description: 'Продвинутые команды Git',
    tags: ['git', 'devops', 'tools']
  },
  {
    title: 'JavaScript: async/await лучшие практики',
    content: 'Всегда обрабатывайте ошибки через try/catch. Используйте Promise.all для параллельных запросов. await в цикле - медленно. Используйте for...of для последовательности. Не забывайте про Promise.allSettled.',
    description: 'Правильное использование асинхронности в JS',
    tags: ['javascript', 'async', 'best-practices']
  },
  {
    title: 'Next.js 14: что нового?',
    content: 'Server Actions для мутаций данных. Partial Prerendering для гибридного рендеринга. Улучшенная работа с метаданными. Оптимизация изображений. Новые паттерны кэширования.',
    description: 'Обзор нововведений Next.js 14',
    tags: ['nextjs', 'react', 'webdev']
  },
  {
    title: 'Дизайн-система: как создать свою',
    content: '1. Цветовая схема (primary, secondary, gray)\n2. Типографика (размеры шрифтов)\n3. Отступы (spacing scale)\n4. Компоненты (кнопки, карточки, формы)\n5. Тени и эффекты\n6. Анимации и переходы',
    description: 'Создание собственной дизайн-системы',
    tags: ['design', 'ui', 'ux']
  },
  {
    title: 'Docker для разработчика',
    content: 'Docker позволяет упаковать приложение с окружением. docker-compose для мультиконтейнерных приложений. Образы: alpine (маленький), node, nginx. Тома для сохранения данных.',
    description: 'Введение в Docker',
    tags: ['docker', 'devops', 'tools']
  },
  {
    title: 'Redux Toolkit: современный Redux',
    content: 'createSlice для создания редьюсеров. configureStore вместо createStore. RTK Query для работы с API. Намного меньше бойлерплейта, чем в классическом Redux.',
    description: 'Redux Toolkit упрощает управление состоянием',
    tags: ['redux', 'react', 'state-management']
  },
  {
    title: 'Как написать хорошее резюме разработчика',
    content: 'Показывайте результаты, а не обязанности. Используйте цифры. GitHub с кодом. Опишите свой стек. Добавьте ссылки на проекты. Будьте честны. Адаптируйте под вакансию.',
    description: 'Советы по составлению IT резюме',
    tags: ['career', 'job', 'advice']
  },
  {
    title: 'Безопасность веб-приложений',
    content: 'XSS - экранируйте ввод пользователя. CSRF - используйте токены. SQL инъекции - ORM или параметризованные запросы. JWT - храните в httpOnly cookies. CORS - настройте правильно. HTTPS - обязательно.',
    description: 'Основы безопасности веб-приложений',
    tags: ['security', 'webdev', 'best-practices']
  },
  {
    title: 'Tailwind CSS: плюсы и минусы',
    content: 'Плюсы: быстрая разработка, не нужно придумывать имена, маленький CSS в продакшене. Минусы: захламленный JSX, порог входа, сложно переиспользовать. Выбирайте под проект.',
    description: 'Анализ популярного CSS фреймворка',
    tags: ['tailwind', 'css', 'frontend']
  },
  {
    title: 'WebSocket: реальное время в вебе',
    content: 'WebSocket позволяет отправлять и получать данные мгновенно. Не через HTTP. Подходит для чатов, игр, уведомлений. Socket.io - библиотека с fallback на polling.',
    description: 'Введение в WebSocket',
    tags: ['websocket', 'real-time', 'javascript']
  },
  {
    title: 'Тестирование React приложений',
    content: 'Jest для unit тестов. React Testing Library для компонентов. Cypress для e2e. Покрывайте критический функционал. Тестируйте поведение, а не реализацию.',
    description: 'Стратегии тестирования React',
    tags: ['testing', 'react', 'jest']
  },
  {
    title: 'Как бороться с выгоранием',
    content: 'Отдыхайте от кода. Занимайтесь спортом. Высыпайтесь. Делайте перерывы. Не берите сверхурочные. Общайтесь с коллегами. Найдите хобби не за компьютером.',
    description: 'Советы для сохранения продуктивности',
    tags: ['mental-health', 'career', 'advice']
  },
  {
    title: 'Web3: что это и зачем?',
    content: 'Децентрализованные приложения на блокчейне. Смарт-контракты. Децентрализованные финансы. NFT. web3.js и ethers.js для взаимодействия. Пока нишевая тема, но перспективная.',
    description: 'Введение в Web3 технологии',
    tags: ['web3', 'blockchain', 'future']
  }
];

async function addData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Добавляем пользователей, если их нет
    const createdUsers = [];
    for (const userData of USERS) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`👤 User ${userData.username} already exists, skipping...`);
        createdUsers.push(existingUser);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          ...userData,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.username} (${user.email})`);
      }
    }

    // Добавляем посты для всех пользователей
    let postCount = 0;
    for (const user of createdUsers) {
      // Каждому пользователю даем 2-3 коротких поста
      const numPosts = Math.floor(Math.random() * 3) + 2; // 2-4 поста
      
      for (let i = 0; i < numPosts; i++) {
        const postData = POSTS[(postCount + i) % POSTS.length];
        const slug = postData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Проверяем, есть ли уже такой пост у пользователя
        const existingPost = await Post.findOne({ 
          slug: `${slug}-${user.username}`,
          author: user._id 
        });
        
        if (!existingPost) {
          const randomDaysAgo = Math.floor(Math.random() * 30);
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - randomDaysAgo);
          
          await Post.create({
            ...postData,
            slug: `${slug}-${user.username}`,
            description: postData.description || postData.content.slice(0, 120),
            author: user._id,
            authorName: user.username,
            views: Math.floor(Math.random() * 500),
            createdAt,
            updatedAt: createdAt
          });
          console.log(`📝 Created post: "${postData.title}" by ${user.username}`);
          postCount++;
        }
      }
    }

    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    
    console.log('\n✅ Data addition completed!');
    console.log(`📊 Total users now: ${totalUsers}`);
    console.log(`📊 Total posts now: ${totalPosts}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addData();