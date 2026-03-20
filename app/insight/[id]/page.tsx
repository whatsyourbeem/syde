import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import InsightDetailClient from "@/components/insight/insight-detail-client";
import TiptapViewer from "@/components/common/tiptap-viewer";

interface InsightDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export async function generateMetadata(
    { params }: InsightDetailPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();

    const { data: insight } = await supabase
        .from("insights")
        .select("title, summary, content, image_url")
        .eq("id", id)
        .single();

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

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            type: "article",
            url: `/insight/${id}`,
        },
    };
}

import { getInitialHtmlFromTiptap } from "@/components/common/tiptap-server-extensions";

export default async function InsightDetailPage({ params }: InsightDetailPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Insight
    const { data: insight, error: insightError } = await supabase
        .from("insights")
        // ...
        .select(`
            *,
            profiles:user_id (
              username,
              full_name,
              avatar_url,
              tagline
            )
          `)
        .eq("id", id)
        .single();

    if (insightError || !insight) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <p className="text-gray-500 font-medium text-lg">인사이트를 찾을 수 없습니다.</p>
                <a href="/insight" className="px-4 py-2 bg-sydeblue text-white rounded-md">목록으로 돌아가기</a>
            </div>
        );
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
        .eq("insight_id", id)
        .order("created_at", { ascending: true });

    // Fetch Stats
    const { count: likesCount } = await supabase
        .from("insight_likes")
        .select("*", { count: "exact", head: true })
        .eq("insight_id", id);

    const { count: bookmarksCount } = await supabase
        .from("insight_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("insight_id", id);

    // Fetch User State
    const { data: { user } } = await supabase.auth.getUser();
    let isLiked = false;
    let isBookmarked = false;

    if (user) {
        const { data: likeData } = await supabase
            .from("insight_likes")
            .select("id")
            .eq("insight_id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        const { data: bookmarkData } = await supabase
            .from("insight_bookmarks")
            .select("insight_id")
            .eq("insight_id", id)
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

    return (
        <InsightDetailClient
            id={id}
            initialInsight={insight}
            initialHtml={initialHtml}
            initialComments={comments || []}
            initialStats={stats}
            initialIsLiked={isLiked}
            initialIsBookmarked={isBookmarked}
            initialCurrentUserId={user?.id || null}
        />
    );
}
