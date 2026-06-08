import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

// GET - получение постов
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const authorId = searchParams.get("authorId");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let query: any = {};

    if (authorId) {
      query.author = authorId;
    }

    // Обработка статуса
    if (status === "draft") {
      const token = getTokenFromRequest(request as any);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const payload = await verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      
      if (authorId) {
        if (payload.userId !== authorId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        query.status = "draft";
      } else {
        query = { status: "draft", author: payload.userId };
      }
    } else if (status === "published") {
      query.status = "published";
    } else {
      query.status = "published";
    }

    if (search) {
      query.$text = { $search: search };
    }

    await connectToDatabase();

    const posts = await Post.find(query)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET posts error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - создание поста (черновик может быть пустым)
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request as any);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    console.log("📝 Создание поста, полученные данные:", body);

    let {
      title,
      slug,
      content,
      description,
      tags,
      status = "draft",
    } = body;

    await connectToDatabase();

    // Для опубликованных постов проверяем обязательные поля
    if (status === "published") {
      if (!title || !title.trim()) {
        return NextResponse.json(
          { error: "Title is required for published posts" },
          { status: 400 }
        );
      }
      if (!content || !content.trim()) {
        return NextResponse.json(
          { error: "Content is required for published posts" },
          { status: 400 }
        );
      }
      if (!description || !description.trim()) {
        return NextResponse.json(
          { error: "Description is required for published posts" },
          { status: 400 }
        );
      }
    }

    // Для черновиков - заполняем пустые значения
    if (!title) title = "Без названия";
    if (!slug && title) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    } else if (!slug) {
      slug = `draft-${Date.now()}`;
    }
    if (!description) description = "";
    if (!content) content = "";
    if (!tags) tags = [];

    // Проверяем уникальность slug
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    const postData = {
      title: title.trim(),
      slug: slug.toLowerCase().trim(),
      content: content.trim(),
      description: description.trim(),
      tags: Array.isArray(tags) ? tags : [],
      author: payload.userId,
      authorName: payload.username,
      status: status === "published" ? "published" : "draft",
      publishedAt: status === "published" ? new Date() : null,
      views: 0,
      likesCount: 0,
    };

    console.log("📝 Создание поста с данными:", postData);

    const post = await Post.create(postData);

    console.log("✅ Пост создан:", post._id, "статус:", post.status);

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("❌ POST post error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}