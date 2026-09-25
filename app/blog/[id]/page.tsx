import { Metadata, ResolvingMetadata } from "next";
import { createStaticClient } from "@/lib/supabase/static";
import { notFound, redirect } from "next/navigation";
import BlogDetailClient from "@/components/blog/blog-detail-client";
import { getAuthorRecentBlogPosts, getBlogPostDetailCached } from "@/lib/queries/blog-queries";
import { extractPlainText } from "@/lib/tiptap-plain-text";

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

interface BlogDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata(
    { params }: BlogDetailPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    const supabase = createStaticClient();

    const blogPost = await getBlogPostDetailCached(supabase, id);

    if (!blogPost) {
        return { title: "글을 찾을 수 없어요 - SYDE 블로그" };
    }

    const title = `${blogPost.title} - SYDE 블로그`;

    const plainText = blogPost.summary || extractPlainText(blogPost.content);

    const description =
        plainText.length > 160 ? plainText.slice(0, 160) + "..." : plainText || "SYDE 블로그 글을 확인해보세요.";
    const images = blogPost.image_url ? [blogPost.image_url] : ["/we-are-syders.png"];

    const keywords = ["SYDE", "사이드프로젝트", "블로그", "인사이트", "IT 커뮤니티"];
    if (blogPost.title) keywords.push(blogPost.title);
    if (plainText) {
        const words = plainText.split(/\s+/).filter((w: string) => w.length > 1);
        keywords.push(...words.slice(0, 5));
    }

    const url = `/blog/${blogPost.slug || blogPost.id}`;

    return {
        title,
        description,
        keywords: keywords.join(", "),
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            images,
            type: "article",
            url,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images,
        },
    };
}

import { getRenderedArticle } from "@/components/common/tiptap-server-extensions";

// Matches the 1h TTL already used by getBlogPostDetailCached/getAuthorRecentBlogPosts,
// so this doesn't introduce staleness beyond what those caches already allow.
export const revalidate = 3600;

// Required for ISR on a dynamic segment with no known params at build time —
// without this, `revalidate` alone doesn't make the route eligible for caching.
export async function generateStaticParams() {
  return [];
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    // Cookie-free client: keeps this page eligible for the Full Route Cache/ISR.
    // Per-viewer state (likes, bookmarks, edit menu) is resolved client-side instead.
    const supabase = createStaticClient();

    // Fetch blog post
    const blogPost = await getBlogPostDetailCached(supabase, id);

    if (!blogPost) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <p className="text-gray-500 font-medium text-lg">글을 찾을 수 없습니다.</p>
                <a href="/blog" className="px-4 py-2 bg-sydeblue text-white rounded-md">목록으로 돌아가기</a>
            </div>
        );
    }

    if (isUUID(id) && blogPost.slug) {
        redirect(`/blog/${blogPost.slug}`);
    }

    const { html: initialHtml, toc } = getRenderedArticle(blogPost.content);

    // None of these depend on each other, so fetch them together.
    // Personalized state (isLiked/isBookmarked/currentUserId) is resolved
    // client-side in BlogDetailClient instead, since this client has no
    // session to check against.
    const [
        authorRecentPosts,
        { data: comments },
        { count: likesCount },
        { count: bookmarksCount },
    ] = await Promise.all([
        getAuthorRecentBlogPosts(supabase, blogPost.user_id, blogPost.id),
        supabase
            .from("blog_post_comments")
            .select(`
                *,
                profiles:user_id (
                  username,
                  avatar_url,
                  tagline
                )
              `)
            .eq("blog_post_id", blogPost.id)
            .order("created_at", { ascending: true }),
        supabase
            .from("blog_post_likes")
            .select("*", { count: "exact", head: true })
            .eq("blog_post_id", blogPost.id),
        supabase
            .from("blog_post_bookmarks")
            .select("*", { count: "exact", head: true })
            .eq("blog_post_id", blogPost.id),
    ]);

    const stats = {
        likes: likesCount || 0,
        comments: comments?.length || 0,
        bookmarks: bookmarksCount || 0,
        views: (blogPost as any).views || 0
    };

    const plainText = blogPost.summary || extractPlainText(blogPost.content);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blogPost.title,
        "description": blogPost.summary || plainText.slice(0, 160) || "SYDE blog post",
        "image": blogPost.image_url || `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/we-are-syders.png`,
        "author": {
            "@type": "Person",
            "name": blogPost.profiles?.full_name || blogPost.profiles?.username || "SYDER",
            "url": blogPost.profiles?.username ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/@${blogPost.profiles.username}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"),
            "jobTitle": blogPost.profiles?.tagline || "메이커"
        },
        "publisher": {
            "@type": "Organization",
            "name": "SYDE (사이드프로젝트 커뮤니티)",
            "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/icon.png`
            }
        },
        "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/blog/${blogPost.slug || blogPost.id}`,
        "datePublished": blogPost.created_at,
        "dateModified": blogPost.updated_at || blogPost.created_at,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogDetailClient
                id={blogPost.id}
                initialPost={blogPost}
                initialHtml={initialHtml}
                toc={toc}
                authorRecentPosts={authorRecentPosts}
                initialComments={comments || []}
                initialStats={stats}
            />
        </>
    );
}
