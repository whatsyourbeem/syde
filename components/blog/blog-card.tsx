"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { toast } from "sonner";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Eye, HeartIcon } from "lucide-react";
import { BlogThumbnail } from "./blog-thumbnail";

export interface BlogCardProps {
    id: string;
    slug?: string;
    title: string;
    summary: string | null;
    createdAt: string;
    imageUrl?: string | null;
    author: {
        id: string;
        /** Profile URLs are /@username; id is only a fallback. */
        username?: string | null;
        name: string;
        role: string;
        avatarUrl?: string;
    };
    stats: {
        likes: number;
        comments: number;
        bookmarks: number;
        views?: number;
    };
    initialStatus?: {
        hasLiked: boolean;
        hasBookmarked: boolean;
    };
    currentUserId: string | null;
    showInteractions?: boolean;
}

import { toggleBlogPostLike } from "@/app/blog/blog-actions";
import { useQueryClient } from "@tanstack/react-query";

export function BlogCard({
    id,
    slug,
    title,
    summary,
    createdAt,
    imageUrl,
    author,
    stats: initialStats,
    initialStatus,
    currentUserId,
    showInteractions = true,
}: BlogCardProps) {
    const { openLoginDialog } = useLoginDialog();
    const queryClient = useQueryClient();
    const [stats, setStats] = useState(initialStats);
    const [status, setStatus] = useState(initialStatus || { hasLiked: false, hasBookmarked: false });
    const [likeLoading, setLikeLoading] = useState(false);

    useEffect(() => {
        setStats(initialStats);
        setStatus(initialStatus || { hasLiked: false, hasBookmarked: false });
    }, [initialStats, initialStatus]);

    const handleLikeToggle = async () => {
        if (!currentUserId) {
            openLoginDialog();
            return;
        }
        if (likeLoading) return;

        setLikeLoading(true);
        const isLiked = status.hasLiked;

        setStats(prev => ({ ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1 }));
        setStatus(prev => ({ ...prev, hasLiked: !isLiked }));

        try {
            await toggleBlogPostLike(id, isLiked);
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
        } catch (error) {
            toast.error("좋아요 처리 중 오류가 발생했습니다.");
            setStats(prev => ({ ...prev, likes: isLiked ? prev.likes + 1 : prev.likes - 1 }));
            setStatus(prev => ({ ...prev, hasLiked: isLiked }));
        } finally {
            setLikeLoading(false);
        }
    };

    const href = `/blog/${slug || id}`;

    return (
        <article className="flex w-full items-stretch gap-4 py-6 md:gap-6 md:py-8">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Link href={href} className="flex flex-col gap-1 focus:outline-none">
                    <h3 className="text-[17px] md:text-[19px] leading-[1.4] font-bold text-black line-clamp-2">{title}</h3>
                    {summary && (
                        <p className="text-[14px] md:text-[15px] leading-[1.5] text-[#777777] line-clamp-2">{summary}</p>
                    )}
                </Link>

                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    <ProfileHoverCard userId={author.id}>
                        <Link href={`/@${author.username || author.id}`} className="flex items-center gap-[5px] w-fit">
                            <Avatar className="w-5 h-5">
                                <AvatarImage src={author.avatarUrl} />
                                <AvatarFallback className="bg-[#D9D9D9]">{author.name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-[12px] font-semibold text-sydeblue">{author.name}</span>
                            {createdAt && (
                                <span className="text-[11px] text-[#777777]">
                                    · {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko }).replace("약 ", "")}
                                </span>
                            )}
                        </Link>
                    </ProfileHoverCard>

                    {/* Only views and likes; a zero count stays quiet so a first post isn't stamped with 0s. */}
                    {showInteractions && (
                        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                            {(stats.views ?? 0) > 0 && (
                                <span className="flex items-center gap-0.5 select-none">
                                    <Eye size={16} />
                                    {stats.views}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleLikeToggle}
                                disabled={likeLoading}
                                aria-label="좋아요"
                                aria-pressed={status.hasLiked}
                                className="group -m-2 flex items-center gap-0.5 rounded-md p-2 hover:bg-red-100 disabled:opacity-50"
                            >
                                <HeartIcon
                                    size={16}
                                    className={status.hasLiked ? "fill-red-500 text-red-500" : "group-hover:text-red-500"}
                                />
                                {stats.likes > 0 && (
                                    <span className={status.hasLiked ? "text-red-500" : "group-hover:text-red-500"}>{stats.likes}</span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {imageUrl && (
                <Link href={href} tabIndex={-1} aria-hidden className="shrink-0 self-start focus:outline-none">
                    <BlogThumbnail
                        src={imageUrl}
                        alt={title}
                        containerClassName="size-[88px] md:size-[120px] rounded-[10px]"
                    />
                </Link>
            )}
        </article>
    );
}
