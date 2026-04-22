import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import InsightDetailClient from "@/components/insight/insight-detail-client";
import TiptapViewer from "@/components/common/tiptap-viewer";

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

interface InsightDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata(
    { params }: InsightDetailPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    const supabase = await createClient();

    let query = supabase
        .from("insights")
        .select("id, slug, title, summary, content, image_url") as any;
        
    if (isUUID(id)) {
        query = query.eq("id", id);
    } else {
        query = query.eq("slug", id);
    }

    const { data: insight } = await query.maybeSingle();

    if (!insight) {
        return { title: "Insight Not Found - SYDE" };
    }

    const title = `${insight.title} - SYDE 인사이트`;

    let plainText = "";
    if (insight.summary) {
        plainText = insight.summary;
    } else {
        try {
            const parsed = JSON.parse(insight.content);
            const extractText = (node: any): string => {
                if (node.type === "text" && node.text) return node.text;
                if (node.content && Array.isArray(node.content)) {
                    return node.content.map(extractText).join(" ");
                }
                return "";
            };
            plainText = extractText(parsed).trim();
        } catch (e) {
            plainText = insight.content || "";
        }
    }

    const description =
        plainText.length > 160 ? plainText.slice(0, 160) + "..." : plainText || "SYDE 인사이트를 확인해보세요.";
    const images = insight.image_url ? [insight.image_url] : ["/we-are-syders.png"];

    const keywords = ["SYDE", "사이드프로젝트", "인사이트", "IT 커뮤니티"];
    if (insight.title) keywords.push(insight.title);
    if (plainText) {
        const words = plainText.split(/\s+/).filter((w: string) => w.length > 1);
        keywords.push(...words.slice(0, 5));
    }

    const url = `/insight/${insight.slug || insight.id}`;

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

import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";

export default async function InsightDetailPage({ params }: InsightDetailPageProps) {
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    const supabase = await createClient();

    // Fetch Insight
    let query = supabase
        .from("insights")
        .select(`
            *,
            profiles:user_id (
              username,
              full_name,
              avatar_url,
              tagline
            )
          `) as any;

    if (isUUID(id)) {
        query = query.eq("id", id);
    } else {
        query = query.eq("slug", id);
    }

    const { data: insight, error: insightError } = await query.maybeSingle();

    if (insightError || !insight) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <p className="text-gray-500 font-medium text-lg">인사이트를 찾을 수 없습니다.</p>
                <a href="/insight" className="px-4 py-2 bg-sydeblue text-white rounded-md">목록으로 돌아가기</a>
            </div>
        );
    }

    if (isUUID(id) && insight.slug) {
        redirect(`/insight/${insight.slug}`);
    }

    const initialHtml = getInitialHtmlFromTiptap(insight.content);

    // Fetch Comments
    const { data: comments } = await supabase
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
        .order("created_at", { ascending: true });

    // Fetch Stats
    const { count: likesCount } = await supabase
        .from("insight_likes")
        .select("*", { count: "exact", head: true })
        .eq("insight_id", insight.id);

    const { count: bookmarksCount } = await supabase
        .from("insight_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("insight_id", insight.id);

    // Fetch User State
    const { data: { user } } = await supabase.auth.getUser();
    let isLiked = false;
    let isBookmarked = false;

    if (user) {
        const { data: likeData } = await supabase
            .from("insight_likes")
            .select("id")
            .eq("insight_id", insight.id)
            .eq("user_id", user.id)
            .maybeSingle();

        const { data: bookmarkData } = await supabase
            .from("insight_bookmarks")
            .select("insight_id")
            .eq("insight_id", insight.id)
            .eq("user_id", user.id)
            .maybeSingle();

        isLiked = !!likeData;
        isBookmarked = !!bookmarkData;
    }

    const stats = {
        likes: likesCount || 0,
        comments: comments?.length || 0,
        bookmarks: bookmarksCount || 0
    };

    let plainText = "";
    if (insight.summary) {
        plainText = insight.summary;
    } else {
        try {
            const parsed = JSON.parse(insight.content);
            const extractText = (node: any): string => {
                if (node.type === "text" && node.text) return node.text;
                if (node.content && Array.isArray(node.content)) {
                    return node.content.map(extractText).join(" ");
                }
                return "";
            };
            plainText = extractText(parsed).trim();
        } catch (e) {
            plainText = insight.content || "";
        }
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": insight.title,
        "description": insight.summary || plainText.slice(0, 160) || "SYDE insight article",
        "image": insight.image_url || `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/we-are-syders.png`,
        "author": {
            "@type": "Person",
            "name": insight.profiles?.full_name || insight.profiles?.username || "SYDER",
            "url": insight.profiles?.username ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/${insight.profiles.username}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"),
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
        "url": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://syde.kr"}/insight/${insight.slug || insight.id}`,
        "datePublished": insight.created_at,
        "dateModified": insight.updated_at || insight.created_at,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <InsightDetailClient
                id={insight.id}
                initialInsight={insight}
                initialHtml={initialHtml}
                initialComments={comments || []}
                initialStats={stats}
                initialIsLiked={isLiked}
                initialIsBookmarked={isBookmarked}
                initialCurrentUserId={user?.id || null}
            />
        </>
    );
}
