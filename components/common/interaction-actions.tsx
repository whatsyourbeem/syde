"use client";

import React, { memo } from "react";
import { HeartIcon, MessageCircle, Bookmark } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { ShareButton } from "@/components/common/share-button";

interface InteractionActionsProps {
    id: string;
    type: "log" | "insight";
    stats: {
        likes: number;
        comments: number;
        bookmarks: number;
    };
    status: {
        hasLiked: boolean;
        hasBookmarked: boolean;
    };
    loading?: {
        like?: boolean;
        bookmark?: boolean;
    };
    onLikeToggle: () => void;
    onBookmarkToggle: () => void;
    onCommentClick?: () => void;
    shareUrl: string;
    shareTitle?: string;
    className?: string; // Additional classes for container (e.g., padding)
}

function InteractionActionsBase({
    id,
    type,
    stats,
    status,
    loading = {},
    onLikeToggle,
    onBookmarkToggle,
    onCommentClick,
    shareUrl,
    shareTitle,
    className = "px-[44px] pt-2",
}: InteractionActionsProps) {
    return (
        <div className={`flex justify-between items-center text-xs md:text-sm text-muted-foreground ${className}`}>
            <TooltipProvider>
                {/* Like Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onLikeToggle();
                            }}
                            disabled={loading.like}
                            className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-red-100 dark:hover:bg-red-900/20 group disabled:opacity-50"
                        >
                            {loading.like ? (
                                <LoadingSpinner size="sm" className="text-red-500" />
                            ) : (
                                <HeartIcon
                                    className={status.hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-500"}
                                    size={18}
                                />
                            )}
                            <span className={status.hasLiked ? "text-red-500" : "group-hover:text-red-500"}>{stats.likes}</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>좋아요</p>
                    </TooltipContent>
                </Tooltip>

                {/* Comment Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={(e) => {
                                if (onCommentClick) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCommentClick();
                                }
                            }}
                            className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-green-100 hover:text-green-500 dark:hover:bg-green-900/20"
                        >
                            <MessageCircle size={18} />
                            <span>{stats.comments}</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>댓글</p>
                    </TooltipContent>
                </Tooltip>

                {/* Share Button (Reusing our existing ShareButton) */}
                <ShareButton
                    url={shareUrl}
                    title={shareTitle || (type === "log" ? "SYDE Log" : "SYDE Insight")}
                    iconSize={18}
                />

                {/* Bookmark Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onBookmarkToggle();
                            }}
                            disabled={loading.bookmark}
                            className="flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-yellow-100 dark:hover:bg-yellow-900/20 group disabled:opacity-50"
                        >
                            {loading.bookmark ? (
                                <LoadingSpinner size="sm" className="text-yellow-500" />
                            ) : (
                                <Bookmark
                                    className={status.hasBookmarked ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground group-hover:text-yellow-500"}
                                    size={18}
                                />
                            )}
                            <span className={status.hasBookmarked ? "text-yellow-500" : "group-hover:text-yellow-500"}>{stats.bookmarks}</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>저장</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

export const InteractionActions = memo(InteractionActionsBase);
