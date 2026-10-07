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
import { cn } from "@/lib/utils";
import { CertifiedBadge } from "@/components/ui/certified-badge";

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
        certified?: boolean;
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
    /** "compact"는 프로필 페이지의 미니 리스트처럼 좁은 공간에 쓰는 축소판. */
    size?: "default" | "compact";
}

import { toggleBlogPostLike } from "@/app/blog/blog-actions";
import { useQueryClient } from "@tanstack/react-query";
import { patchBlogPost } from "@/lib/queries/cache-patches";

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
    size = "default",
}: BlogCardProps) {
    const isCompact = size === "compact";
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

        // 목록 캐시도 같이 고쳐 두고, 실패하면 되돌린다.
        const rollback = patchBlogPost(queryClient, id, (post) => ({
            ...post,
            stats: { ...post.stats, likes: Math.max(0, post.stats.likes + (isLiked ? -1 : 1)) },
            initialStatus: { hasBookmarked: false, ...post.initialStatus, hasLiked: !isLiked },
        }));

        try {
            await toggleBlogPostLike(id, isLiked);
        } catch (error) {
            rollback();
            toast.error("좋아요 처리 중 오류가 발생했습니다.");
            setStats(prev => ({ ...prev, likes: isLiked ? prev.likes + 1 : prev.likes - 1 }));
            setStatus(prev => ({ ...prev, hasLiked: isLiked }));
        } finally {
            setLikeLoading(false);
        }
    };

    const href = `/blog/${slug || id}`;

    return (
        <article className={cn(
            "flex w-full items-stretch",
            isCompact ? "gap-3 py-3" : "gap-4 py-6 md:gap-6 md:py-8"
        )}>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Link href={href} prefetch={false} className="flex flex-col gap-1 focus:outline-none">
                    <h3 className={cn(
                        "leading-[1.4] font-bold text-black line-clamp-2",
                        isCompact ? "text-[13px]" : "text-[17px] md:text-[19px]"
                    )}>{title}</h3>
                    {summary && (
                        <p className={cn(
                            "leading-[1.5] text-[#777777]",
                            isCompact ? "text-[12px] line-clamp-1" : "text-[14px] md:text-[15px] line-clamp-2"
                        )}>{summary}</p>
                    )}
                </Link>

                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    <ProfileHoverCard userId={author.id}>
                        <Link href={`/@${author.username || author.id}`} prefetch={false} className="flex items-center gap-[5px] w-fit">
                            <Avatar className={isCompact ? "w-4 h-4" : "w-5 h-5"}>
                                <AvatarImage src={author.avatarUrl} />
                                <AvatarFallback className="bg-[#D9D9D9]">{author.name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className={cn("font-semibold text-sydeblue", isCompact ? "text-[11px]" : "text-[12px]")}>{author.name}</span>
                            {author.certified && <CertifiedBadge size="sm" />}
                            {createdAt && (
                                <span className={cn("text-[#777777]", isCompact ? "text-[10px]" : "text-[11px]")}>
                                    · {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko }).replace("약 ", "")}
                                </span>
                            )}
                        </Link>
                    </ProfileHoverCard>

                    {/* Only views and likes; a zero count stays quiet so a first post isn't stamped with 0s. */}
                    {showInteractions && (
                        <div className={cn("flex items-center gap-3 text-muted-foreground", isCompact ? "text-[11px]" : "text-[12px]")}>
                            {(stats.views ?? 0) > 0 && (
                                <span className="flex items-center gap-0.5 select-none">
                                    <Eye size={isCompact ? 13 : 16} />
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
                                    size={isCompact ? 13 : 16}
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
                <Link href={href} prefetch={false} tabIndex={-1} aria-hidden className="shrink-0 self-start focus:outline-none">
                    <BlogThumbnail
                        src={imageUrl}
                        alt={title}
                        containerClassName={isCompact ? "size-[56px] rounded-[8px]" : "size-[88px] md:size-[120px] rounded-[10px]"}
                    />
                </Link>
            )}
        </article>
    );
}
