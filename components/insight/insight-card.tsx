"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { InteractionActions } from "@/components/common/interaction-actions";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { toast } from "sonner";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { InsightThumbnail } from "./insight-thumbnail";

export interface InsightCardProps {
    id: string;
    title: string;
    summary: string | null;
    createdAt: string;
    imageUrl?: string | null;
    author: {
        id: string;
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
    createdAt,
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

    return (
        <div className="bg-transparent border-none shadow-none flex flex-col w-full max-w-[369px] md:max-w-[352px] h-fit">
            {/* Thumbnail Area - Links to Insight */}
            {disableLink ? (
                <InsightThumbnail
                    src={imageUrl}
                    alt={title}
                    containerClassName="w-full aspect-w-1 aspect-h-1 flex-none rounded-[12px]"
                />
            ) : (
                <Link href={`/insight/${id}`} className="block focus:outline-none">
                    <InsightThumbnail
                        src={imageUrl}
                        alt={title}
                        containerClassName="w-full aspect-w-1 aspect-h-1 cursor-pointer flex-none rounded-[12px]"
                    />
                </Link>
            )}

            {/* Unified Content Container */}
            <div className={cn(
                "p-3 flex flex-col gap-[5px]",
                isCentered && "items-center text-center"
            )}>
                {/* Title & Summary - Links to Insight */}
                {disableLink ? (
                    <div className="flex flex-col gap-[5px]">
                        <h3 className="text-[18px] md:text-[16px] leading-[150%] font-bold text-black line-clamp-1 overflow-hidden">
                            {title}
                        </h3>
                        <p className="text-[14px] leading-[150%] text-[#000000] md:text-[#777777] line-clamp-1">
                            {summary || "소개 글이 없습니다."}
                        </p>
                    </div>
                ) : (
                    <Link href={`/insight/${id}`} className="flex flex-col gap-[5px] focus:outline-none">
                        <h3 className="text-[18px] md:text-[16px] leading-[150%] font-bold text-black line-clamp-1 overflow-hidden">
                            {title}
                        </h3>
                        <p className="text-[14px] leading-[150%] text-[#000000] md:text-[#777777] line-clamp-1">
                            {summary || "소개 글이 없습니다."}
                        </p>
                    </Link>
                )}

                {/* Author Info Area - Separate Link to Profile */}
                <ProfileHoverCard userId={author.id}>
                    <Link href={`/${author.id}`} className={cn(
                        "flex items-center gap-[5px] mt-auto w-fit",
                        isCentered && "justify-center mx-auto"
                    )}>
                        <Avatar className="w-5 h-5">
                            <AvatarImage src={author.avatarUrl} />
                            <AvatarFallback className="bg-[#D9D9D9]">{author.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-[2px]">
                            <span className="text-[12px] text-[#777777]">by.</span>
                            <span className="text-[12px] font-semibold text-sydeblue">{author.name}</span>
                            {createdAt && (
                                <span className="text-[11px] text-[#777777] ml-[2px]">
                                    · {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko }).replace("약 ", "")}
                                </span>
                            )}
                        </div>
                    </Link>
                </ProfileHoverCard>
            </div>

            {/* Interaction Bar */}
            {showInteractions && (
                <div className="pt-3 md:pt-0 h-11 md:h-7">
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
                        className="px-3 pt-0 md:pt-1 pb-1"
                    />
                </div>
            )}
        </div>
    );
}
