import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();

    const insight = await getBlogPostDetailCached(supabase, id);

    if (!insight) {
        return { title: "글을 찾을 수 없어요 - SYDE 블로그" };
    }

    const title = `${insight.title} - SYDE 블로그`;

    const plainText = insight.summary || extractPlainText(insight.content);

    const description =
        plainText.length > 160 ? plainText.slice(0, 160) + "..." : plainText || "SYDE 블로그 글을 확인해보세요.";
    const images = insight.image_url ? [insight.image_url] : ["/we-are-syders.png"];

    const keywords = ["SYDE", "사이드프로젝트", "블로그", "인사이트", "IT 커뮤니티"];
    if (insight.title) keywords.push(insight.title);
    if (plainText) {
        const words = plainText.split(/\s+/).filter((w: string) => w.length > 1);
        keywords.push(...words.slice(0, 5));
    }

    const url = `/blog/${insight.slug || insight.id}`;

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

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    const supabase = await createClient();

    // Fetch Insight
    const insight = await getBlogPostDetailCached(supabase, id);

    if (!insight) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <p className="text-gray-500 font-medium text-lg">글을 찾을 수 없습니다.</p>
                <a href="/blog" className="px-4 py-2 bg-sydeblue text-white rounded-md">목록으로 돌아가기</a>
            </div>
        );
    }

    if (isUUID(id) && insight.slug) {
        redirect(`/blog/${insight.slug}`);
    }

    const { html: initialHtml, toc } = getRenderedArticle(insight.content);

    // None of these depend on each other, so fetch them together.
    const [
        authorRecentPosts,
        { data: comments },
        { count: likesCount },
        { count: bookmarksCount },
        { data: { user } },
    ] = await Promise.all([
        getAuthorRecentBlogPosts(supabase, insight.user_id, insight.id),
        supabase
            .from("insight_comments")
            .select(`
                *,
                profiles:user_id (
                  username,
                  avatar_url,
                  tagline
                )
              `)
            .eq("insight_id", insight.id)
            .order("created_at", { ascending: true }),
        supabase
            .from("insight_likes")
            .select("*", { count: "exact", head: true })
            .eq("insight_id", insight.id),
        supabase
            .from("insight_bookmarks")
            .select("*", { count: "exact", head: true })
            .eq("insight_id", insight.id),
        supabase.auth.getUser(),
    ]);

    let isLiked = false;
    let isBookmarked = false;

    if (user) {
        const [{ data: likeData }, { data: bookmarkData }] = await Promise.all([
            supabase
                .from("insight_likes")
                .select("id")
                .eq("insight_id", insight.id)
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase
                .from("insight_bookmarks")
                .select("insight_id")
                .eq("insight_id", insight.id)
                .eq("user_id", user.id)
                .maybeSingle(),
        ]);

        isLiked = !!likeData;
        isBookmarked = !!bookmarkData;
    }

    const stats = {
        likes: likesCount || 0,
        comments: comments?.length || 0,
        bookmarks: bookmarksCount || 0,
        views: (insight as any).views || 0
    };

    const plainText = insight.summary || extractPlainText(insight.content);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": insight.title,
        "description": insight.summary || plainText.slice(0, 160) || "SYDE insight article",
        "image": insight.image_url || `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/we-are-syders.png`,
        "author": {
            "@type": "Person",
            "name": insight.profiles?.full_name || insight.profiles?.username || "SYDER",
            "url": insight.profiles?.username ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/@${insight.profiles.username}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"),
            "jobTitle": insight.profiles?.tagline || "메이커"
        },
        "publisher": {
            "@type": "Organization",
            "name": "SYDE (사이드프로젝트 커뮤니티)",
            "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/icon.png`
            }
        },
        "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/blog/${insight.slug || insight.id}`,
        "datePublished": insight.created_at,
        "dateModified": insight.updated_at || insight.created_at,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogDetailClient
                id={insight.id}
                initialPost={insight}
                initialHtml={initialHtml}
                toc={toc}
                authorRecentPosts={authorRecentPosts}
                initialComments={comments || []}
                initialStats={stats}
                initialIsLiked={isLiked}
                initialIsBookmarked={isBookmarked}
                initialCurrentUserId={user?.id || null}
            />
        </>
    );
}
