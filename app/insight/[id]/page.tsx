"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    MoreHorizontal,
    Heart,
    MessageCircle,
    Share2,
    Bookmark
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();

    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [insight, setInsight] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [stats, setStats] = useState({ likes: 0, comments: 0, bookmarks: 0 });

    useEffect(() => {
        setIsMounted(true);
        async function fetchData() {
            setLoading(true);
            try {
                const { data: insightData, error: insightError } = await supabase
                    .from("insights")
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

                if (insightError) throw insightError;
                setInsight(insightData);

                const { data: commentData, error: commentError } = await supabase
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

                if (commentError) throw commentError;
                setComments(commentData || []);

                const { count: likesCount } = await supabase
                    .from("insight_likes")
                    .select("*", { count: "exact", head: true })
                    .eq("insight_id", id);

                const { count: bookmarksCount } = await supabase
                    .from("insight_bookmarks")
                    .select("*", { count: "exact", head: true })
                    .eq("insight_id", id);

                setStats({
                    likes: likesCount || 0,
                    comments: commentData?.length || 0,
                    bookmarks: bookmarksCount || 0
                });

            } catch (error) {
                console.error("Error fetching insight data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002040]"></div>
            </div>
        );
    }

    if (!insight) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <p className="text-gray-500 font-medium text-lg">인사이트를 찾을 수 없습니다.</p>
                <Link href="/insight">
                    <Button className="bg-[#002040] text-white">목록으로 돌아가기</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white max-w-[393px] mx-auto relative font-[Pretendard] pb-10">
            {/* Main Content Area */}
            <main className="flex flex-col items-center pt-4">
                {/* Navigation & Image section */}
                <section className="w-full flex flex-col gap-2">
                    <div className="flex items-center px-2">
                        <Link href="/insight" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6 text-[#434343]" />
                        </Link>
                        <span className="text-sm font-semibold text-gray-700 ml-1">인사이트 상세</span>
                    </div>

                    <div className="w-full aspect-square px-4 pb-4">
                        <div className="w-full h-full bg-[#222E35] rounded-[10px] overflow-hidden relative border border-gray-100 flex items-center justify-center">
                            {insight.image_url ? (
                                <img src={insight.image_url} alt={insight.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="relative text-white flex flex-col items-center">
                                    <span className="text-[10px] absolute -top-4 -left-6 rotate-[-15deg] font-bold opacity-70">SYDE!</span>
                                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center rotate-[-5deg] shadow-lg">
                                        <div className="w-16 h-16 bg-[#222E35] rounded-full flex flex-col items-center justify-center relative">
                                            <div className="flex gap-4 mt-2">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <div className="w-8 h-4 border-b-2 border-white rounded-full mt-1"></div>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-xl font-bold tracking-tight">we're SYDERS !</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Title Section */}
                <section className="w-full flex flex-col px-4 pb-4 gap-2 border-b-[0.5px] border-[#B7B7B7]">
                    <h1 className="text-[24px] font-bold leading-[130%] text-black">
                        {insight.title}
                    </h1>

                    {/* Summary / One-line Intro */}
                    {insight.summary && (
                        <p className="text-[14px] text-gray-500 font-medium leading-[140%] mb-1">
                            {insight.summary}
                        </p>
                    )}

                    <div className="flex flex-row items-center justify-between mt-1">
                        <div className="flex flex-row items-center gap-[5px] h-6">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={insight.profiles?.avatar_url} />
                                <AvatarFallback className="bg-[#D9D9D9] text-[10px]">{insight.profiles?.username?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1">
                                <span className="text-[14px] font-semibold text-[#002040]">{insight.profiles?.username || '알 수 없는 사용자'}</span>
                                <span className="text-[12px] text-[#777777]">| {insight.profiles?.tagline || '멤버'}</span>
                            </div>
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-[#434343]" />
                        </button>
                    </div>
                </section>

                {/* Content area */}
                <section className="w-full px-4 py-8 border-b-[0.5px] border-[#B7B7B7]">
                    <div className="px-1 text-black">
                        <p className="text-[18px] leading-[1.6] whitespace-pre-wrap font-medium">
                            {insight.content}
                        </p>
                    </div>
                </section>

                {/* Actions bar */}
                <section className="w-full h-14 flex flex-row items-center justify-between px-6">
                    <div className="flex gap-6">
                        <button className="flex items-center gap-2 group">
                            <Heart className="w-5 h-5 text-[#777777] group-hover:text-red-500 transition-colors" />
                            <span className="text-sm font-medium text-[#777777]">{stats.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 group">
                            <MessageCircle className="w-5 h-5 text-[#777777] group-hover:text-blue-500 transition-colors" />
                            <span className="text-sm font-medium text-[#777777]">{stats.comments}</span>
                        </button>
                    </div>
                    <div className="flex gap-5">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <Share2 className="w-5 h-5 text-[#808080]" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <Bookmark className={cn("w-5 h-5", stats.bookmarks > 0 ? "text-[#FFD60A] fill-current" : "text-[#777777]")} />
                        </button>
                    </div>
                </section>

                {/* Comments section */}
                <section className="w-full flex flex-col px-4 py-6 gap-6 border-t-[0.5px] border-[#B7B7B7] bg-gray-50/30">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-5 h-5 bg-[#002040] rounded-sm opacity-90 flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">SY</span>
                        </div>
                        <h2 className="text-lg font-bold text-[#002040]">댓글 및 리뷰</h2>
                    </div>

                    <div className="flex flex-col gap-6 px-1 min-h-[50px]">
                        {comments.length > 0 ? comments.map((comment, index) => (
                            <div key={comment.id} className="flex flex-row gap-3 items-start relative">
                                <Avatar className="w-9 h-9 flex-none border border-gray-100">
                                    <AvatarImage src={comment.profiles?.avatar_url} />
                                    <AvatarFallback className="bg-[#D9D9D9] text-xs">{comment.profiles?.username?.[0] || 'A'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1 flex-grow">
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            <span className="text-sm font-bold text-[#002040]">{comment.profiles?.username}</span>
                                            <span className="text-[11px] text-[#777777] bg-gray-100 px-1.5 py-0.5 rounded">{comment.profiles?.tagline || '멤버'}</span>
                                        </div>
                                        <span className="text-[11px] text-[#999999]">
                                            {isMounted ? new Date(comment.created_at).toLocaleDateString() : ""}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-gray-800">{comment.content}</p>
                                </div>
                                {index < comments.length - 1 && (
                                    <div className="absolute left-[18px] top-10 w-[0.5px] h-6 bg-[#B7B7B7]/50" />
                                )}
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 py-8 text-center bg-white rounded-lg border border-dashed border-gray-200">
                                첫 번째 댓글을 남겨보세요!
                            </p>
                        )}
                    </div>

                    {/* Comment input area */}
                    <div className="flex flex-row items-center gap-2 pt-2">
                        <div className="flex-grow">
                            <input
                                placeholder="댓글을 작성해 보세요..."
                                className="w-full h-10 bg-white border border-[#B7B7B7] rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#002040] transition-shadow"
                            />
                        </div>
                        <Button className="h-10 px-4 bg-[#002040] hover:bg-[#003060] text-white text-sm font-semibold rounded-xl">
                            등록
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
