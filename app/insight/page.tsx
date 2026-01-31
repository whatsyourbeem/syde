"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { InteractionActions } from "@/components/common/interaction-actions";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { toast } from "sonner";

interface InsightCardProps {
    id: string;
    title: string;
    summary: string | null;
    imageUrl?: string | null;
    author: {
        name: string;
        role: string;
        avatarUrl?: string;
    };
    stats: {
        likes: number;
        comments: number;
        bookmarks: number;
    };
    initialStatus?: {
        hasLiked: boolean;
        hasBookmarked: boolean;
    };
    currentUserId: string | null;
}

function InsightCard({ id, title, summary, imageUrl, author, stats: initialStats, initialStatus, currentUserId }: InsightCardProps) {
    const supabase = createClient();
    const { openLoginDialog } = useLoginDialog();
    const [stats, setStats] = useState(initialStats);
    const [status, setStatus] = useState(initialStatus || { hasLiked: false, hasBookmarked: false });
    const [loading, setLoading] = useState({ like: false, bookmark: false });

    const handleLikeToggle = async () => {
        if (!currentUserId) {
            openLoginDialog();
            return;
        }
        if (loading.like) return;

        setLoading(prev => ({ ...prev, like: true }));
        const isLiked = status.hasLiked;

        setStats(prev => ({ ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1 }));
        setStatus(prev => ({ ...prev, hasLiked: !isLiked }));

        try {
            if (isLiked) {
                const { error } = await supabase.from("insight_likes").delete().eq("insight_id", id).eq("user_id", currentUserId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("insight_likes").insert({ insight_id: id, user_id: currentUserId });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            toast.error("좋아요 처리 중 오류가 발생했습니다.");
            setStats(prev => ({ ...prev, likes: isLiked ? prev.likes + 1 : prev.likes - 1 }));
            setStatus(prev => ({ ...prev, hasLiked: isLiked }));
        } finally {
            setLoading(prev => ({ ...prev, like: false }));
        }
    };

    const handleBookmarkToggle = async () => {
        if (!currentUserId) {
            openLoginDialog();
            return;
        }
        if (loading.bookmark) return;

        setLoading(prev => ({ ...prev, bookmark: true }));
        const isBookmarked = status.hasBookmarked;

        setStats(prev => ({ ...prev, bookmarks: isBookmarked ? prev.bookmarks - 1 : prev.bookmarks + 1 }));
        setStatus(prev => ({ ...prev, hasBookmarked: !isBookmarked }));

        try {
            if (isBookmarked) {
                const { error } = await supabase.from("insight_bookmarks").delete().eq("insight_id", id).eq("user_id", currentUserId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("insight_bookmarks").insert({ insight_id: id, user_id: currentUserId });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error);
            toast.error("저장 처리 중 오류가 발생했습니다.");
            setStats(prev => ({ ...prev, bookmarks: isBookmarked ? prev.bookmarks + 1 : prev.bookmarks - 1 }));
            setStatus(prev => ({ ...prev, hasBookmarked: isBookmarked }));
        } finally {
            setLoading(prev => ({ ...prev, bookmark: false }));
        }
    };

    return (
        <div className="bg-[#FAFAFA] rounded-[12px] overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col w-[369px] md:w-[352px] h-[515px] md:h-[479px]">
            <Link href={`/insight/${id}`} className="flex flex-col h-full">
                {/* Thumbnail Area */}
                <div className="aspect-square bg-[#222E35] flex items-center justify-center relative overflow-hidden cursor-pointer flex-none w-[369px] md:w-[352px] h-[369px] md:h-[352px] rounded-[12px]">
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="relative text-white flex flex-col items-center">
                                <span className="text-[10px] absolute -top-4 -left-6 rotate-[-15deg] font-bold opacity-70">SYDE!</span>
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] flex items-center justify-center rotate-[-5deg]">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#222E35] rounded-full flex flex-col items-center justify-center relative">
                                        <div className="flex gap-4 mt-2">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                        <div className="w-8 h-4 border-b-2 border-white rounded-full mt-1"></div>
                                    </div>
                                </div>
                                <p className="mt-4 text-xl font-bold tracking-tight">we're SYDERS !</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-3 pt-3 pb-2 h-[102px] md:h-[99px] flex flex-col gap-[5px]">
                    <h3 className="text-[18px] md:text-[16px] leading-[150%] font-bold text-black md:text-gray-900 line-clamp-2">
                        {title}
                    </h3>
                    <p className="text-[14px] leading-[150%] text-[#000000] md:text-gray-500 line-clamp-1">
                        {summary || "소개 글이 없습니다."}
                    </p>

                    {/* Author Info - Responsive layout */}
                    <div className="flex items-center gap-[5px] mt-auto">
                        <Avatar className="w-5 h-5">
                            <AvatarImage src={author.avatarUrl} />
                            <AvatarFallback className="bg-[#D9D9D9]">{author.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-[5px]">
                            <span className="text-[12px] font-semibold text-[#002040]">{author.name}</span>
                            <span className="text-[11px] text-[#777777]">| {author.role}</span>
                        </div>
                    </div>
                </div>

                {/* Interaction Bar */}
                <div className="pt-4 md:pt-2 px-1 h-11 md:h-7 mb-2">
                    <InteractionActions
                        id={id}
                        type="insight"
                        stats={stats}
                        status={status}
                        loading={loading}
                        onLikeToggle={handleLikeToggle}
                        onBookmarkToggle={handleBookmarkToggle}
                        shareUrl={`/insight/${id}`}
                        shareTitle={title}
                        className="px-2 md:px-3 pt-0"
                    />
                </div>
            </Link>
        </div>
    );
}

export default function InsightPage() {
    const supabase = createClient();
    const [insights, setInsights] = useState<InsightCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUserId(user?.id || null);

                const { data, error } = await supabase
                    .from("insights")
                    .select(`
                        id,
                        title,
                        summary,
                        image_url,
                        created_at,
                        profiles:user_id (
                            username,
                            avatar_url,
                            tagline
                        ),
                        insight_comments (id),
                        insight_likes (id, user_id),
                        insight_bookmarks (insight_id, user_id)
                    `)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const mappedData: InsightCardProps[] = (data || []).map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    summary: item.summary,
                    imageUrl: item.image_url,
                    author: {
                        name: item.profiles?.username || "알 수 없는 사용자",
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

                setInsights(mappedData);
            } catch (error) {
                console.error("Error fetching insights:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchInitialData();
    }, [supabase]);

    return (
        <div className="min-h-screen bg-background pb-20 relative flex flex-col h-full overflow-y-scroll custom-scrollbar">
            {/* Unified Title Section (Same as Meetup Page) */}
            <div className="w-full bg-card border-b-[0.5px] border-b-[#B7B7B7]">
                <div className="w-full max-w-6xl mx-auto px-4 py-8">
                    <div className="flex flex-col justify-center items-center gap-4 text-center">
                        <h2 className="text-[24px] font-bold text-[#002040] py-2 leading-[29px]">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-x-12 md:gap-y-12 justify-items-center">
                        {insights.map((insight) => (
                            <InsightCard key={insight.id} {...insight} />
                        ))}
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
            <Link href="/insight/write">
                <Button className="fixed bottom-10 right-10 w-14 h-14 rounded-full bg-[#002040] hover:bg-[#003060] shadow-xl flex items-center justify-center p-0 z-50">
                    <Plus className="w-8 h-8 text-white" />
                </Button>
            </Link>
        </div>
    );
}



