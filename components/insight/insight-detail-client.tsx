"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    MoreHorizontal,
    Heart,
    MessageCircle,
    Bookmark
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { InsightDeleteDialog } from "@/components/insight/insight-delete-dialog";
import { InteractionActions } from "@/components/common/interaction-actions";
import RichContent from "@/components/common/rich-content";
import { getCategoryLabel } from "@/lib/insight-categories";
import { ArticleToc } from "@/components/insight/article-toc";
import { AuthorCard, type AuthorRecentInsight } from "@/components/insight/author-card";
import type { TocItem } from "@/components/common/tiptap-server-extensions";
import { useLoginDialog } from "@/context/LoginDialogContext";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InsightThumbnail } from "./insight-thumbnail";
import { deleteInsight } from "@/lib/queries/insight-queries";
import { toggleInsightLike, toggleInsightBookmark, incrementInsightViews } from "@/app/insight/insight-actions";
import { useQueryClient } from "@tanstack/react-query";

interface InsightDetailClientProps {
    id: string;
    initialInsight: any;
    initialHtml?: string;
    toc?: TocItem[];
    authorRecentInsights?: AuthorRecentInsight[];
    initialComments: any[];
    initialStats: { likes: number; comments: number; bookmarks: number; views?: number };
    initialIsLiked: boolean;
    initialIsBookmarked: boolean;
    initialCurrentUserId: string | null;
}

export default function InsightDetailClient({
    id,
    initialInsight,
    initialHtml,
    toc = [],
    authorRecentInsights = [],
    initialComments,
    initialStats,
    initialIsLiked,
    initialIsBookmarked,
    initialCurrentUserId
}: InsightDetailClientProps) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const [insight, setInsight] = useState<any>(initialInsight);
    const [stats, setStats] = useState(initialStats);
    const [viewsCount, setViewsCount] = useState(initialStats.views ?? 0);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    
    // Unified comment states
    const [replyTo, setReplyTo] = useState<{
        parentId: string;
        authorName: string;
        authorUsername: string | null;
        authorAvatarUrl: string | null;
    } | null>(null);
    const [newCommentId, setNewCommentId] = useState<string | undefined>(undefined);
    const [newParentCommentId, setNewParentCommentId] = useState<string | undefined>(undefined);
    
    const [isAuthor, setIsAuthor] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(initialCurrentUserId);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    // Increment view count once per 1h per browser via localStorage
    useEffect(() => {
        const key = `viewed_insight_${id}`;
        const lastViewed = localStorage.getItem(key);
        const now = Date.now();
        if (!lastViewed || now - parseInt(lastViewed) > 1 * 60 * 60 * 1000) {
            incrementInsightViews(id);
            localStorage.setItem(key, String(now));
            setViewsCount(prev => prev + 1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (currentUserId && insight?.user_id) {
            setIsAuthor(currentUserId === insight.user_id);
        }
    }, [currentUserId, insight]);

    const handleEdit = () => {
        router.push(`/insight/write?id=${id}`);
    };

    const handleDelete = () => {
        setIsMenuOpen(false);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteInsight(supabase, id);

            toast.success("인사이트가 삭제되었습니다.");
            router.push("/insight");
        } catch (error) {
            console.error("Error deleting insight:", error);
            toast.error("삭제 중 오류가 발생했습니다.");
        } finally {
            setDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const { openLoginDialog } = useLoginDialog();
    const [likeLoading, setLikeLoading] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    const toggleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            openLoginDialog();
            return;
        }

        if (likeLoading) return;
        setLikeLoading(true);

        const prevLiked = isLiked;
        setIsLiked(!isLiked);
        setStats(prev => ({ ...prev, likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1 }));

        try {
            await toggleInsightLike(id, isLiked);
            queryClient.invalidateQueries({ queryKey: ["insights"] });
        } catch (error) {
            setIsLiked(prevLiked);
            setStats(prev => ({ ...prev, likes: isLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1) }));
            toast.error("처리 중 오류가 발생했습니다.");
        } finally {
            setLikeLoading(false);
        }
    };

    const toggleBookmark = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            openLoginDialog();
            return;
        }

        if (bookmarkLoading) return;
        setBookmarkLoading(true);

        const prevBookmarked = isBookmarked;
        setIsBookmarked(!isBookmarked);
        setStats(prev => ({ ...prev, bookmarks: isBookmarked ? Math.max(0, prev.bookmarks - 1) : prev.bookmarks + 1 }));

        try {
            await toggleInsightBookmark(id, isBookmarked);
            queryClient.invalidateQueries({ queryKey: ["insights"] });
        } catch (error) {
            setIsBookmarked(prevBookmarked);
            setStats(prev => ({ ...prev, bookmarks: isBookmarked ? prev.bookmarks + 1 : Math.max(0, prev.bookmarks - 1) }));
            toast.error("처리 중 오류가 발생했습니다.");
        } finally {
            setBookmarkLoading(false);
        }
    };


    if (!insight) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <p className="text-gray-500 font-medium text-lg">인사이트를 찾을 수 없습니다.</p>
                <Link href="/insight">
                    <Button className="bg-sydeblue text-white">목록으로 돌아가기</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white w-full max-w-6xl mx-auto relative font-[Pretendard] pb-10 px-4 md:px-6 border-x border-gray-50">
            <main className="flex flex-col pt-4">
                <section className="w-full flex flex-col gap-2 pb-6 md:pb-8 border-b-[0.5px] border-[#B7B7B7]">
                    {/* Same 768px column as the body, so the header and the writing line up. */}
                    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
                        <div className="w-full flex items-center justify-between">
                            <Link href="/insight" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                                <ChevronLeft className="w-6 h-6 text-[#434343]" />
                            </Link>
                            {isAuthor ? (
                            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full -mr-2 shrink-0">
                                        <MoreHorizontal className="w-6 h-6 text-[#434343]" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[120px] bg-white rounded-xl shadow-lg border border-gray-100 p-1">
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/insight/${id}/edit`}
                                            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 text-sm text-sydeblue hover:bg-gray-50 focus:bg-gray-50 font-medium"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            수정
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                        className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 font-medium"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        삭제
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                                ) : null}
                        </div>

                        <InsightThumbnail
                            hideWhenEmpty
                            src={insight.image_url}
                            alt={insight.title}
                            containerClassName="w-full aspect-w-16 aspect-h-9 rounded-[12px]"
                        />

                        <h1 className="text-[30px] md:text-[40px] leading-[1.3] font-bold text-black break-words">
                            {insight.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <ProfileHoverCard userId={insight.user_id}>
                                <Link href={`/@${insight.user_id}`} className="flex items-center gap-[5px] w-fit">
                                    <Avatar className="w-5 h-5">
                                        <AvatarImage src={insight.profiles?.avatar_url} />
                                        <AvatarFallback className="bg-[#D9D9D9]">{insight.profiles?.username?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-[13px] font-semibold text-sydeblue">{insight.profiles?.full_name || insight.profiles?.username || '알 수 없는 사용자'}</span>
                                </Link>
                            </ProfileHoverCard>
                            {insight.created_at && (
                                <span className="text-[12px] text-[#777777]">
                                    · {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true, locale: ko }).replace("약 ", "")}
                                </span>
                            )}
                            {getCategoryLabel(insight.category) && (
                                <span className="text-[12px] text-[#777777]">· {getCategoryLabel(insight.category)}</span>
                            )}
                        </div>
                    </div>
                </section>

                <section className="w-full py-8 md:py-16 border-b-[0.5px] border-[#B7B7B7]">
                    {/* Same 768px column as the writing form, so posts read the way they were written. */}
                    <div className="relative px-1 text-black w-full max-w-3xl mx-auto">
                        <ArticleToc items={toc} />
                        <RichContent html={initialHtml ?? ""} />
                        {Array.isArray(insight.tags) && insight.tags.length > 0 && (
                            <ul className="mt-10 flex flex-wrap gap-2">
                                {insight.tags.map((tag: string) => (
                                    <li key={tag} className="rounded-full bg-sydeblue/10 px-3 py-1 text-[13px] text-sydeblue">
                                        #{tag}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <div className="w-full flex justify-center py-4">
                    <InteractionActions
                        id={id}
                        type="insight"
                        stats={{ ...stats, views: viewsCount }}
                        status={{
                            hasLiked: isLiked,
                            hasBookmarked: isBookmarked
                        }}
                        loading={{
                            like: likeLoading,
                            bookmark: bookmarkLoading
                        }}
                        onLikeToggle={toggleLike}
                        onBookmarkToggle={toggleBookmark}
                        shareUrl={`/insight/${id}`}
                        shareTitle={insight.title}
                        className="w-full max-w-2xl h-16 px-6"
                        showShare={false}
                    />
                </div>

                <AuthorCard
                    author={{
                        id: insight.user_id,
                        name: insight.profiles?.full_name || insight.profiles?.username || "알 수 없는 사용자",
                        tagline: insight.profiles?.tagline ?? null,
                        avatarUrl: insight.profiles?.avatar_url ?? null,
                    }}
                    recentInsights={authorRecentInsights}
                />

                <section className="w-full flex flex-col py-6 md:py-12 gap-6 border-t-[0.5px] border-[#B7B7B7] bg-gray-50/10 rounded-b-xl">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-[24px] h-[4px] bg-sydeorange rounded-full shrink-0" />
                        <h2 className="text-xl font-bold text-sydeblue">댓글 및 리뷰</h2>
                    </div>

                    <div className="flex flex-col gap-4 px-1 min-h-[100px]">
                        <CommentList
                            insightId={id}
                            currentUserId={currentUserId}
                            isDetailPage={true}
                            setReplyTo={setReplyTo}
                            newCommentId={newCommentId}
                            newParentCommentId={newParentCommentId}
                            onCommentDeleted={() => {
                                setStats(prev => ({ ...prev, comments: Math.max(0, prev.comments - 1) }));
                                queryClient.invalidateQueries({ queryKey: ["insights"] });
                            }}
                        />
                    </div>

                    <div className="pt-4">
                        <CommentForm
                            insightId={id}
                            parentCommentId={replyTo?.parentId}
                            currentUserId={currentUserId}
                            onCommentAdded={() => {
                                setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
                                setReplyTo(null);
                                setNewCommentId(Math.random().toString());
                                setNewParentCommentId(replyTo?.parentId);
                                queryClient.invalidateQueries({ queryKey: ["insights"] });
                            }}
                            onCancel={replyTo ? () => setReplyTo(null) : undefined}
                            replyTo={replyTo}
                        />
                    </div>
                </section>
            </main>

            <InsightDeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                loading={deleting}
            />
        </div>
    );
}

