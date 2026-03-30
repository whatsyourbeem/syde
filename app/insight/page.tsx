"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { InsightCard, InsightCardProps } from "@/components/insight/insight-card";

export default function InsightPage() {
    const supabase = createClient();
    const router = useRouter();
    const { openLoginDialog } = useLoginDialog();
    const [insights, setInsights] = useState<InsightCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const ITEMS_PER_PAGE = 18;

    const fetchInsights = async (pageIndex: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (pageIndex === 0) {
            setCurrentUserId(user?.id || null);
        }

        const from = pageIndex * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error } = await supabase
            .from("insights")
            .select(`
                id,
                user_id,
                title,
                summary,
                image_url,
                created_at,
                profiles:user_id (
                    username,
                    full_name,
                    avatar_url,
                    tagline
                ),
                insight_comments (id),
                insight_likes (id, user_id),
                insight_bookmarks (insight_id, user_id)
            `)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) throw error;

        const mappedData: InsightCardProps[] = (data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            createdAt: item.created_at,
            imageUrl: item.image_url,
            author: {
                id: item.user_id,
                name: item.profiles?.full_name || item.profiles?.username || "알 수 없는 사용자",
                role: item.profiles?.tagline || "멤버",
                avatarUrl: item.profiles?.avatar_url
            },
            stats: {
                likes: item.insight_likes?.length || 0,
                comments: item.insight_comments?.length || 0,
                bookmarks: item.insight_bookmarks?.length || 0
            },
            initialStatus: {
                hasLiked: user ? item.insight_likes?.some((l: any) => l.user_id === user.id) : false,
                hasBookmarked: user ? item.insight_bookmarks?.some((b: any) => b.user_id === user.id) : false
            },
            currentUserId: user?.id || null
        }));

        return {
            data: mappedData,
            hasMore: data?.length === ITEMS_PER_PAGE
        };
    };

    useEffect(() => {
        async function loadInitial() {
            setLoading(true);
            try {
                const result = await fetchInsights(0);
                setInsights(result.data);
                setHasMore(result.hasMore);
                setPage(0);
            } catch (error) {
                console.error("Error fetching insights:", error);
            } finally {
                setLoading(false);
            }
        }

        loadInitial();
    }, [supabase]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const nextPageIndex = page + 1;
            const result = await fetchInsights(nextPageIndex);
            setInsights((prev) => [...prev, ...result.data]);
            setHasMore(result.hasMore);
            setPage(nextPageIndex);
        } catch (error) {
            console.error("Error loading more insights:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 relative flex flex-col h-full overflow-y-scroll custom-scrollbar">
            {/* Unified Title Section (Same as Meetup Page) */}
            <div className="w-full bg-card border-b-[0.5px] border-b-[#B7B7B7]">
                <div className="w-full max-w-6xl mx-auto px-4 py-8">
                    <div className="flex flex-col justify-center items-center gap-4 text-center">
                        <h2 className="text-[24px] font-bold text-sydeblue py-2 leading-[29px]">
                            Insights
                        </h2>
                        <p className="text-[14px] font-normal text-[#777777] leading-[17px]">사이드 프로젝트를 더 오래, 더 잘 하기 위한 이야기들.</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-3 md:px-0 py-[6px] md:py-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112D4E]"></div>
                    </div>
                ) : insights.length > 0 ? (
                    <div className="flex flex-col items-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-9 md:gap-y-14 justify-items-center w-full">
                            {insights.map((insight) => (
                                <InsightCard key={insight.id} {...insight} />
                            ))}
                        </div>
                        {hasMore && (
                            <Button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                variant="outline"
                                className="mt-12 rounded-full px-6 py-2 text-[0.875rem] font-[700] text-[#777777] border-[#E2E8F0] hover:bg-slate-50"
                            >
                                {loadingMore ? "불러오는 중..." : "더보기"}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400 flex flex-col gap-2">
                        <div className="text-4xl">💭</div>
                        <p>작성된 인사이트가 없습니다.</p>
                        <p className="text-xs">첫 번째 인사이트의 주인공이 되어보세요!</p>
                    </div>
                )}
            </div>

            {/* Floating Create Button */}
            <Button
                onClick={() => {
                    if (!currentUserId) {
                        openLoginDialog();
                    } else {
                        router.push("/insight/write");
                    }
                }}
                className="fixed bottom-10 right-10 w-14 h-14 rounded-full bg-sydeblue hover:bg-sydeblue/90 shadow-xl flex items-center justify-center p-0 z-50">
                <Plus className="w-8 h-8 text-white" />
            </Button>
        </div>
    );
}
