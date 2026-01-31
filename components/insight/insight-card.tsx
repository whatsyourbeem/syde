"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { InteractionActions } from "@/components/common/interaction-actions";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

export interface InsightCardProps {
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
    showInteractions?: boolean;
    disableLink?: boolean;
    isCentered?: boolean;
}

export function InsightCard({
    id,
    title,
    summary,
    imageUrl,
    author,
    stats: initialStats,
    initialStatus,
    currentUserId,
    showInteractions = true,
    disableLink = false,
    isCentered = false
}: InsightCardProps) {
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

    const content = (
        <div className="flex flex-col h-full">
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
            <div className={cn(
                "p-3 pt-3 pb-2 h-[102px] md:h-[99px] flex flex-col gap-[5px]",
                isCentered && "items-center text-center"
            )}>
                <h3 className="text-[18px] md:text-[16px] leading-[150%] font-bold text-black line-clamp-2">
                    {title}
                </h3>
                <p className="text-[14px] leading-[150%] text-[#000000] md:text-[#777777] line-clamp-1">
                    {summary || "소개 글이 없습니다."}
                </p>

                {/* Author Info - Responsive layout */}
                <div className={cn(
                    "flex items-center gap-[5px] mt-auto",
                    isCentered && "justify-center"
                )}>
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
            {showInteractions && (
                <div className="pt-3 md:pt-0 px-1 h-11 md:h-7">
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
                        className="px-2 md:px-[30.5px] pt-0 md:pt-1 pb-1"
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-transparent border-none shadow-none overflow-hidden flex flex-col w-[369px] md:w-[352px] h-fit transition-all duration-200 ease-in-out hover:scale-[1.01]">
            {disableLink ? (
                <div className="flex flex-col h-full">
                    {content}
                </div>
            ) : (
                <Link href={`/insight/${id}`} className="flex flex-col h-full focus:outline-none">
                    {content}
                </Link>
            )}
        </div>
    );
}
