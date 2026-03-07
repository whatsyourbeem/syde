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
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { InsightDeleteDialog } from "@/components/insight/insight-delete-dialog";
import { InteractionActions } from "@/components/common/interaction-actions";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { cn } from "@/lib/utils";
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

interface InsightDetailClientProps {
    id: string;
    initialInsight: any;
    initialHtml?: string;
    initialComments: any[];
    initialStats: { likes: number; comments: number; bookmarks: number };
    initialIsLiked: boolean;
    initialIsBookmarked: boolean;
    initialCurrentUserId: string | null;
}

export default function InsightDetailClient({
    id,
    initialInsight,
    initialHtml,
    initialComments,
    initialStats,
    initialIsLiked,
    initialIsBookmarked,
    initialCurrentUserId
}: InsightDetailClientProps) {
    const supabase = createClient();

    const [isMounted, setIsMounted] = useState(false);
    const [insight, setInsight] = useState<any>(initialInsight);
    const [comments, setComments] = useState<any[]>(initialComments);
    const [stats, setStats] = useState(initialStats);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(initialCurrentUserId);
    const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [isCommentDeleteDialogOpen, setIsCommentDeleteDialogOpen] = useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
            const { error } = await supabase
                .from("insights")
                .delete()
                .eq("id", id);

            if (error) throw error;

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

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("로그인이 필요한 서비스입니다.");
                return;
            }

            const { data, error } = await supabase
                .from("insight_comments")
                .insert([
                    {
                        insight_id: id,
                        user_id: user.id,
                        content: newComment.trim()
                    }
                ])
                .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            tagline
          )
        `)
                .single();

            if (error) throw error;

            setComments(prev => [...prev, data]);
            setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
            setNewComment("");

            if (textareaRef.current) {
                textareaRef.current.style.height = "48px";
            }

            toast.success("댓글이 등록되었습니다.");
        } catch (error: any) {
            console.error("Error submitting comment:", error);
            toast.error("댓글 등록 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCommentUpdate = async () => {
        if (!editingCommentId || !editingContent.trim()) return;

        try {
            const { error } = await supabase
                .from("insight_comments")
                .update({ content: editingContent.trim() })
                .eq("id", editingCommentId);

            if (error) throw error;

            setComments(prev => prev.map(c =>
                c.id === editingCommentId ? { ...c, content: editingContent.trim() } : c
            ));
            setEditingCommentId(null);
            setEditingContent("");
            toast.success("댓글이 수정되었습니다.");
        } catch (error) {
            console.error("Error updating comment:", error);
            toast.error("수정 중 오류가 발생했습니다.");
        }
    };

    const handleCommentDeleteRequest = (commentId: string) => {
        setCommentToDeleteId(commentId);
        setActiveCommentMenuId(null);
        setIsCommentDeleteDialogOpen(true);
    };

    const confirmCommentDelete = async () => {
        if (!commentToDeleteId) return;

        // Use the same 'deleting' state for simplicity or add a new one if needed
        setDeleting(true);
        try {
            const { error } = await supabase
                .from("insight_comments")
                .delete()
                .eq("id", commentToDeleteId);

            if (error) throw error;

            setComments(prev => prev.filter(c => c.id !== commentToDeleteId));
            setStats(prev => ({ ...prev, comments: Math.max(0, prev.comments - 1) }));
            toast.success("댓글이 삭제되었습니다.");
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("삭제 중 오류가 발생했습니다.");
        } finally {
            setDeleting(false);
            setIsCommentDeleteDialogOpen(false);
            setCommentToDeleteId(null);
        }
    };

    const { openLoginDialog } = useLoginDialog();
    const [likeLoading, setLikeLoading] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    const toggleLike = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                openLoginDialog();
                return;
            }

            if (likeLoading) return;
            setLikeLoading(true);

            if (isLiked) {
                const { error } = await supabase
                    .from("insight_likes")
                    .delete()
                    .eq("insight_id", id)
                    .eq("user_id", user.id);
                if (error) throw error;
                setStats(prev => ({ ...prev, likes: Math.max(0, prev.likes - 1) }));
                setIsLiked(false);
            } else {
                const { error } = await supabase
                    .from("insight_likes")
                    .insert({ insight_id: id, user_id: user.id });
                if (error) throw error;
                setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
                setIsLiked(true);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        } finally {
            setLikeLoading(false);
        }
    };

    const toggleBookmark = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                openLoginDialog();
                return;
            }

            if (bookmarkLoading) return;
            setBookmarkLoading(true);

            if (isBookmarked) {
                const { error } = await supabase
                    .from("insight_bookmarks")
                    .delete()
                    .eq("insight_id", id)
                    .eq("user_id", user.id);
                if (error) throw error;
                setStats(prev => ({ ...prev, bookmarks: Math.max(0, prev.bookmarks - 1) }));
                setIsBookmarked(false);
            } else {
                const { error } = await supabase
                    .from("insight_bookmarks")
                    .insert({ insight_id: id, user_id: user.id });
                if (error) throw error;
                setStats(prev => ({ ...prev, bookmarks: prev.bookmarks + 1 }));
                setIsBookmarked(true);
            }
        } catch (error) {
            console.error("Error toggling bookmark:", error);
            toast.error("처리 중 오류가 발생했습니다.");
        } finally {
            setBookmarkLoading(false);
        }
    };

    const parseContent = (content: any) => {
        if (!content) return null;
        try {
            // Attempt to parse as JSON (for Tiptap content)
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed;
            }
            return content;
        } catch (e) {
            // If parsing fails, it's likely plain text
            return content;
        }
    };


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
        <div className="flex flex-col bg-white w-full max-w-6xl mx-auto relative font-[Pretendard] pb-10 px-4 md:px-6 border-x border-gray-50">
            <main className="flex flex-col pt-4">
                <section className="w-full flex flex-col gap-2">
                    {/* Top Navigation & Thumbnail Area */}
                    <div className="w-full flex justify-center pb-8 border-b-[0.5px] border-[#B7B7B7]">
                        <div className="bg-transparent border-none shadow-none flex flex-col items-center w-full h-fit">
                            {/* Header Row: Back Button (Left), Thumbnail (Center), More Button (Right) */}
                            <div className="w-full flex items-start justify-between mb-4">
                                <Link href="/insight" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                                    <ChevronLeft className="w-6 h-6 text-[#434343]" />
                                </Link>

                                {/* Thumbnail */}
                                <div className="aspect-square bg-[#222E35] flex items-center justify-center relative overflow-hidden flex-none w-[200px] sm:w-[280px] md:w-[300px] h-[200px] sm:h-[280px] md:h-[300px] rounded-[12px] shrink-0">
                                    {insight.image_url ? (
                                        <img src={insight.image_url} alt={insight.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src="/we-are-syders.png" alt="We are SYDERS" className="w-full h-full object-cover" />
                                    )}
                                </div>

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
                                                    className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 text-sm text-[#002040] hover:bg-gray-50 focus:bg-gray-50 font-medium"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    수정
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setIsDeleteDialogOpen(true)}
                                                className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 text-sm text-[#FF0000] hover:bg-red-50 focus:bg-red-50 focus:text-[#FF0000] font-medium"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <div className="w-10 shrink-0" /> /* Placeholder to keep thumbnail centered */
                                )}
                            </div>

                            {/* Unified Content Container */}
                            <div className="p-3 flex flex-col gap-[5px] items-center text-center">
                                {/* Title & Summary */}
                                <div className="flex flex-col gap-[5px]">
                                    <h3 className="text-[28px] leading-[150%] font-bold text-black h-auto line-clamp-none">
                                        {insight.title}
                                    </h3>
                                    <p className="text-[16px] leading-[150%] text-[#777777] line-clamp-none">
                                        {insight.summary || "소개 글이 없습니다."}
                                    </p>
                                </div>

                                {/* Author Profile Area */}
                                <div className="flex flex-col items-center mt-auto mx-auto gap-1">
                                    <ProfileHoverCard userId={insight.user_id}>
                                        <Link href={`/${insight.user_id}`} className="flex items-center gap-[5px] w-fit justify-center">
                                            <Avatar className="w-5 h-5">
                                                <AvatarImage src={insight.profiles?.avatar_url} />
                                                <AvatarFallback className="bg-[#D9D9D9]">{insight.profiles?.username?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex items-center gap-[5px]">
                                                <span className="text-[12px] font-semibold text-[#002040]">{insight.profiles?.full_name || insight.profiles?.username || '알 수 없는 사용자'}</span>
                                                <span className="text-[11px] text-[#777777]">· {insight.profiles?.tagline || '멤버'}</span>
                                            </div>
                                        </Link>
                                    </ProfileHoverCard>
                                    {insight.created_at && (
                                        <span className="text-[11px] text-[#777777]">
                                            {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true, locale: ko }).replace("약 ", "")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full py-8 md:py-16 border-b-[0.5px] border-[#B7B7B7]">
                    <div className="px-1 text-black md:text-lg w-full">
                        {/* SEO fallback: 봇이나 브라우저 초기 렌더링 시 서버에서 미리 만든 HTML을 표시 */}
                        {initialHtml && !isMounted && (
                            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: initialHtml }} />
                        )}
                        {/* 클라이언트 사이드 Tiptap 에디터 로드 후 교체 */}
                        <div className={cn(initialHtml && !isMounted ? "hidden" : "block")}>
                            <TiptapViewer content={parseContent(insight.content)} />
                        </div>
                    </div>
                </section>

                <div className="w-full flex justify-center py-4">
                    <InteractionActions
                        id={id}
                        type="insight"
                        stats={stats}
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
                    />
                </div>

                <section className="w-full flex flex-col py-6 md:py-12 gap-6 border-t-[0.5px] border-[#B7B7B7] bg-gray-50/10 rounded-b-xl">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-[24px] h-[4px] bg-sydeorange rounded-full shrink-0" />
                        <h2 className="text-xl font-bold text-[#002040]">댓글 및 리뷰</h2>
                    </div>

                    <div className="flex flex-col gap-6 px-1 min-h-[100px]">
                        {comments.length > 0 ? comments.map((comment, index) => (
                            <div key={comment.id} className="flex flex-row gap-4 items-start relative">
                                <Avatar className="w-[36px] h-[36px] flex-none border border-gray-100">
                                    <AvatarImage src={comment.profiles?.avatar_url} />
                                    <AvatarFallback className="bg-[#D9D9D9] text-sm">{comment.profiles?.username?.[0] || 'A'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1.5 flex-grow">
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[14px] font-bold text-[#002040]">{comment.profiles?.username}</span>
                                            <span className="text-[12px] text-[#777777]">{comment.profiles?.tagline || '멤버'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[12px] text-[#777777]">
                                                {isMounted ? new Date(comment.created_at).toLocaleDateString() : ""}
                                            </span>
                                            {currentUserId === comment.user_id && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveCommentMenuId(activeCommentMenuId === comment.id ? null : comment.id)}
                                                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis w-4 h-4 text-[#777777]"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                    </button>
                                                    {activeCommentMenuId === comment.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-40"
                                                                onClick={() => setActiveCommentMenuId(null)}
                                                            />
                                                            <div className="absolute right-0 top-8 w-[103px] bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.25)] rounded-[10px] p-1 flex flex-col items-start z-50">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCommentId(comment.id);
                                                                        setEditingContent(comment.content);
                                                                        setActiveCommentMenuId(null);
                                                                    }}
                                                                    className="w-full h-8 flex flex-row justify-center items-center p-[4px_8px] gap-2 bg-white rounded-[12px] hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#002040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                                    <span className="text-[14px] text-[#002040]">수정</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCommentDeleteRequest(comment.id)}
                                                                    className="w-full h-8 flex flex-row justify-center items-center p-[4px_8px] gap-2 bg-white rounded-[12px] hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                                    <span className="text-[14px] text-[#FF0004]">삭제</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {editingCommentId === comment.id ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                            <textarea
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                                className="w-full bg-white border border-[#B7B7B7] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#002040] transition-shadow min-h-[80px] resize-none"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="text-sm text-[#777777] hover:text-black font-medium"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    onClick={handleCommentUpdate}
                                                    className="text-sm text-[#002040] hover:underline font-bold"
                                                >
                                                    저장
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm md:text-base leading-relaxed text-gray-800">{comment.content}</p>
                                    )}
                                </div>
                                {index < comments.length - 1 && (
                                    <div className="absolute left-[19px] top-11 w-[0.5px] h-8 bg-[#B7B7B7]/50" />
                                )}
                            </div>
                        )) : (
                            <p className="text-base text-gray-400 py-12 text-center bg-white rounded-xl border border-dashed border-gray-200">
                                첫 번째 댓글을 남겨보세요!
                            </p>
                        )}
                    </div>

                    <div className="flex flex-row items-center gap-3 pt-4">
                        <div className="flex-grow">
                            <textarea
                                ref={textareaRef}
                                value={newComment}
                                onChange={(e) => {
                                    setNewComment(e.target.value);
                                    if (textareaRef.current) {
                                        textareaRef.current.style.height = '48px'; // Reset height to recalculate
                                        const scrollHeight = textareaRef.current.scrollHeight;
                                        textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px'; // Max approx 4 lines (120px)
                                    }
                                }}
                                disabled={submitting}
                                placeholder="댓글을 작성해 보세요..."
                                rows={1}
                                className="w-full h-[48px] py-3 bg-white border border-[#B7B7B7] rounded-xl px-4 text-base focus:outline-none focus:ring-1 focus:ring-[#002040] transition-shadow disabled:opacity-50 resize-none overflow-y-auto"
                            />
                        </div>
                        <Button
                            onClick={handleCommentSubmit}
                            disabled={submitting || !newComment.trim()}
                            className="h-12 px-6 bg-[#002040] hover:bg-[#003060] text-white text-base font-semibold rounded-xl"
                        >
                            {submitting ? "..." : "등록"}
                        </Button>
                    </div>
                </section>
            </main>

            <InsightDeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                loading={deleting}
            />

            <InsightDeleteDialog
                isOpen={isCommentDeleteDialogOpen}
                onClose={() => setIsCommentDeleteDialogOpen(false)}
                onConfirm={confirmCommentDelete}
                loading={deleting}
                title="잠깐! 정말 댓글을 삭제하실건가요?"
                description="삭제 후에는 되돌릴 수 없어요."
            />
        </div>
    );
}

