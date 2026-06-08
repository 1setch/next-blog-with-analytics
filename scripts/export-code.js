const fs = require('fs');
const path = require('path');

// Игнорируемые папки и файлы
const IGNORED_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.vercel',
  'public/uploads', // загруженные файлы
  'scripts', // сам скрипт не включаем
];

const IGNORED_FILES = [
  '.DS_Store',
  'package-lock.json', // ← ИГНОРИРУЕМ
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.env.local',
  '.env.production',
  '.gitignore',
  'project-code.txt', // чтобы не включать сам себя
];

const EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',  // код
  '.css', '.scss', '.module.css', // стили
  '.json', // конфиги (кроме package-lock)
  '.md', // документация
  '.html', '.txt',
];

// Корень проекта (папка где лежит scripts)
const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'project-code.txt');

function shouldIgnoreDir(dirPath) {
  const name = path.basename(dirPath);
  return IGNORED_DIRS.includes(name) || IGNORED_DIRS.some(ignored => dirPath.includes(ignored));
}

function shouldIgnoreFile(filePath) {
  const name = path.basename(filePath);
  if (IGNORED_FILES.includes(name)) return true;
  
  const ext = path.extname(filePath);
  return !EXTENSIONS.includes(ext);
}

function getAllFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!shouldIgnoreDir(fullPath)) {
        getAllFiles(fullPath, fileList);
      }
    } else {
      if (!shouldIgnoreFile(fullPath)) {
        fileList.push(fullPath);
      }
    }
  }
  
  return fileList;
}

function getRelativePath(filePath) {
  return path.relative(ROOT_DIR, filePath);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return `// Ошибка чтения файла: ${error.message}\n`;
  }
}

function generateHeader() {
  const date = new Date().toLocaleString('ru-RU');
  return `// ============================================
// PROJECT CODE EXPORT
// Дата: ${date}
// ============================================
// Игнорируемые папки: ${IGNORED_DIRS.join(', ')}
// Игнорируемые файлы: ${IGNORED_FILES.join(', ')}
// ============================================

`;
}

function generateFileBlock(filePath, content) {
  const separator = '='.repeat(80);
  return `
${separator}
// Файл: ${getRelativePath(filePath)}
${separator}

${content}
`;
}

function main() {
  console.log('🔍 Сбор файлов проекта...');
  const allFiles = getAllFiles(ROOT_DIR);
  
  console.log(`📁 Найдено файлов: ${allFiles.length}`);
  
  // Сортируем файлы для удобства
  const sortedFiles = allFiles.sort((a, b) => {
    // Сначала app, потом components, потом lib, потом остальные
    const getPriority = (file) => {
      if (file.includes('/app/')) return 1;
      if (file.includes('/components/')) return 2;
      if (file.includes('/lib/')) return 3;
      if (file.includes('/models/')) return 4;
      if (file.includes('/context/')) return 5;
      if (file.includes('/public/')) return 6;
      return 7;
    };
    return getPriority(a) - getPriority(b);
  });
  
  let output = generateHeader();
  let processedCount = 0;
  
  for (const file of sortedFiles) {
    const content = readFileContent(file);
    output += generateFileBlock(file, content);
    processedCount++;
  }
  
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  
  console.log(`✅ Готово! Обработано файлов: ${processedCount}`);
  console.log(`📄 Файл сохранен: ${OUTPUT_FILE}`);
  console.log(`📊 Размер файла: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
}

main();