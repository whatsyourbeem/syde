"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Bookmark, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/common/share-button";

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
}

function InsightCard({ id, title, summary, imageUrl, author, stats }: InsightCardProps) {
    return (
        <Link href={`/insight/${id}`}>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-6 transition-all hover:shadow-md cursor-pointer">
                {/* Thumbnail Area */}
                <div className="aspect-[4/3] bg-[#222E35] flex items-center justify-center relative overflow-hidden">
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="relative text-white flex flex-col items-center">
                                <span className="text-[10px] absolute -top-4 -left-6 rotate-[-15deg] font-bold opacity-70">SYDE!</span>
                                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center rotate-[-5deg]">
                                    <div className="w-16 h-16 bg-[#222E35] rounded-full flex flex-col items-center justify-center relative">
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
                <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                        {summary || "소개 글이 없습니다."}
                    </p>

                    {/* Author Info */}
                    <div className="flex items-center gap-2 mb-4">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={author.avatarUrl} />
                            <AvatarFallback>{author.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-800">{author.name}</span>
                            <span className="text-xs text-gray-400">| {author.role}</span>
                        </div>
                    </div>

                    {/* Interaction Bar */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Heart className="w-5 h-5" />
                                <span className="text-xs font-medium">{stats.likes}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-xs font-medium">{stats.comments}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <ShareButton
                                url={`/insight/${id}`}
                                title={title}
                                iconSize={20}
                                className="text-gray-400"
                            />
                            <div className="flex items-center gap-1.5 text-[#F5C518] font-bold">
                                <Bookmark className={cn("w-5 h-5", stats.bookmarks > 0 ? "fill-current" : "")} />
                                <span className="text-xs">{stats.bookmarks}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function InsightPage() {
    const supabase = createClient();
    const [insights, setInsights] = useState<InsightCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInsights() {
            setLoading(true);
            try {
                // insights 테이블 조회(summary 포함)
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
                        insight_likes (id),
                        insight_bookmarks (insight_id)
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
                    }
                }));

                setInsights(mappedData);
            } catch (error) {
                console.error("Error fetching insights:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchInsights();
    }, [supabase]);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 relative">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 py-10 mb-6 text-center shadow-sm">
                <h1 className="text-3xl font-extrabold text-[#112D4E] mb-2 tracking-tight">
                    Insights
                </h1>
                <p className="text-sm text-gray-400 font-medium">
                    사이드 프로젝트를 더 오래, 더 잘 하기 위한 이야기들.
                </p>
            </div>

            {/* Content */}
            <div className="max-w-md mx-auto px-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112D4E]"></div>
                    </div>
                ) : insights.length > 0 ? (
                    insights.map((insight) => (
                        <InsightCard key={insight.id} {...insight} />
                    ))
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

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
