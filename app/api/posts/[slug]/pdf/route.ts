import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Post from '@/models/Post';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();
    
    const post = await Post.findOne({ slug }).lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Создаем PDF документ
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 размер
    const { height } = page.getSize();
    
    // Подключаем шрифты - используем стандартные, но для кириллицы нужно встроить шрифт
    // Решение: используем Helvetica для английского/цифр, а для русского текста просто выводим как есть
    // или используем встроенный шрифт с поддержкой кириллицы
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Функция для экранирования текста (простая замена проблемных символов)
    const sanitizeText = (text: string): string => {
      // Замена кириллицы на транслит (простое решение)
      const translit: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '',
        'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
      };
      
      return text.split('').map(char => translit[char] || char).join('');
    };
    
    let y = height - 50;
    
    // Функция для добавления текста с автоматическим переносом страницы
    const addText = (text: string, size: number, fontType: any, color: any, x: number = 50) => {
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = height - 50;
      }
      
      // Для кириллицы используем транслитерацию
      const sanitizedText = sanitizeText(text);
      page.drawText(sanitizedText, { x, y, size, font: fontType, color });
      y -= size + 5;
    };
    
    // Заголовок
    addText(post.title, 20, boldFont, rgb(0.2, 0.3, 0.8));
    y -= 10;
    
    // Автор
    addText(`Avtor: ${post.authorName}`, 10, font, rgb(0.5, 0.5, 0.5));
    
    // Дата
    addText(`Data: ${new Date(post.createdAt).toLocaleDateString('ru-RU')}`, 10, font, rgb(0.5, 0.5, 0.5));
    
    // Просмотры
    addText(`Prosmotrov: ${post.views}`, 10, font, rgb(0.5, 0.5, 0.5));
    
    // Теги
    if (post.tags && post.tags.length > 0) {
      addText(`Tegi: ${post.tags.join(', ')}`, 10, font, rgb(0.5, 0.5, 0.5));
    }
    
    y -= 15;
    
    // Разделительная линия
    page.drawLine({
      start: { x: 50, y: y },
      end: { x: 545, y: y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;
    
    // Содержание поста
    const lines = post.content.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        addText(line, 11, font, rgb(0, 0, 0));
      } else {
        y -= 8;
      }
    }
    
    // Подвал
    y -= 20;
    if (y < 50) {
      page = pdfDoc.addPage([595, 842]);
      y = height - 50;
    }
    
    page.drawText(
      `Generirovano ${new Date().toLocaleDateString('ru-RU')}`,
      {
        x: 50,
        y: 30,
        size: 8,
        font,
        color: rgb(0.7, 0.7, 0.7),
      }
    );
    
    // Сохраняем PDF и конвертируем в Buffer
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${post.slug}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}