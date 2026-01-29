"use client";

import React, { use, useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

export default function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();

    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [insight, setInsight] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [stats, setStats] = useState({ likes: 0, comments: 0, bookmarks: 0 });
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [isCommentDeleteDialogOpen, setIsCommentDeleteDialogOpen] = useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
    const router = useRouter();

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

                // 현재 사용자의 좋아요/북마크 상태 확인
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: likeData } = await supabase
                        .from("insight_likes")
                        .select("id")
                        .eq("insight_id", id)
                        .eq("user_id", user.id)
                        .maybeSingle();

                    const { data: bookmarkData } = await supabase
                        .from("insight_bookmarks")
                        .select("insight_id")
                        .eq("insight_id", id)
                        .eq("user_id", user.id)
                        .maybeSingle();

                    setIsLiked(!!likeData);
                    setIsBookmarked(!!bookmarkData);
                    setCurrentUserId(user.id);
                }

            } catch (error) {
                console.error("Error fetching insight data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, supabase]);

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

    const toggleLike = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("로그인이 필요한 기능입니다.");
                return;
            }

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
        }
    };

    const toggleBookmark = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("로그인이 필요한 기능입니다.");
                return;
            }

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
        }
    };

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
            <main className="flex flex-col items-center pt-4">
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

                <section className="w-full flex flex-col px-4 pb-4 gap-2 border-b-[0.5px] border-[#B7B7B7]">
                    <h1 className="text-[24px] font-bold leading-[130%] text-black">
                        {insight.title}
                    </h1>
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
                        <div className="relative">
                            {/* More Button (Using provided SVG) */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis w-5 h-5 text-[#434343]" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                            </button>

                            {/* log_more_overlay (Figma CSS Applied) */}
                            {isMenuOpen && isAuthor && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <div
                                        className="absolute right-0 top-8 w-[103px] h-[72px] bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.25)] rounded-[10px] p-1 flex flex-col items-start z-50"
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '4px' }}
                                    >
                                        {/* 수정버튼 */}
                                        <button
                                            onClick={handleEdit}
                                            className="w-[95px] h-8 flex flex-row justify-center items-center p-[4px_8px] gap-2 bg-white rounded-[12px] hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-4 h-4 relative flex items-center justify-center">
                                                {/* Simple Pencil Icon for Edit */}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#002040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </div>
                                            <span className="text-[14px] leading-[17px] font-[Pretendard] text-[#002040] flex items-center">수정</span>
                                        </button>

                                        {/* 삭제버튼 */}
                                        <button
                                            onClick={handleDelete}
                                            className="w-[95px] h-8 flex flex-row justify-center items-center p-[4px_8px] gap-2 bg-white rounded-[12px] hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-4 h-4 relative flex items-center justify-center">
                                                {/* Trash Icon for Delete */}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </div>
                                            <span className="text-[14px] leading-[17px] font-[Pretendard] text-[#FF0004] flex items-center">삭제</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <section className="w-full px-4 py-8 border-b-[0.5px] border-[#B7B7B7]">
                    <div className="px-1 text-black">
                        <p className="text-[18px] leading-[1.6] whitespace-pre-wrap font-medium">
                            {insight.content}
                        </p>
                    </div>
                </section>

                <InteractionActions
                    id={id}
                    type="insight"
                    stats={stats}
                    status={{
                        hasLiked: isLiked,
                        hasBookmarked: isBookmarked
                    }}
                    onLikeToggle={toggleLike}
                    onBookmarkToggle={toggleBookmark}
                    shareUrl={`/insight/${id}`}
                    shareTitle={insight.title}
                    className="w-full h-14 px-6" // 상세 페이지 스타일 유지
                />

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
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-[#999999]">
                                                {isMounted ? new Date(comment.created_at).toLocaleDateString() : ""}
                                            </span>
                                            {currentUserId === comment.user_id && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveCommentMenuId(activeCommentMenuId === comment.id ? null : comment.id)}
                                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis w-4 h-4 text-[#777777]"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                    </button>
                                                    {activeCommentMenuId === comment.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-40"
                                                                onClick={() => setActiveCommentMenuId(null)}
                                                            />
                                                            <div className="absolute right-0 top-6 w-[103px] h-[72px] bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.25)] rounded-[10px] p-1 flex flex-col items-start z-50">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingCommentId(comment.id);
                                                                        setEditingContent(comment.content);
                                                                        setActiveCommentMenuId(null);
                                                                    }}
                                                                    className="w-[95px] h-8 flex flex-row justify-center items-center p-[4px_8px] gap-2 bg-white rounded-[12px] hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#002040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                                    <span className="text-[14px] leading-[17px] font-[Pretendard] text-[#002040]">수정</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCommentDeleteRequest(comment.id)}
                                                                    className="w-[95px] h-8 flex flex-row justify-center items-center p-[4px_8px] gap-2 bg-white rounded-[12px] hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                                    <span className="text-[14px] leading-[17px] font-[Pretendard] text-[#FF0004]">삭제</span>
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
                                                className="w-full bg-white border border-[#B7B7B7] rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#002040] transition-shadow min-h-[60px] resize-none"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="text-xs text-[#777777] hover:text-black font-medium"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    onClick={handleCommentUpdate}
                                                    className="text-xs text-[#002040] hover:underline font-bold"
                                                >
                                                    저장
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed text-gray-800">{comment.content}</p>
                                    )}
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

                    <div className="flex flex-row items-center gap-2 pt-2">
                        <div className="flex-grow">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                        handleCommentSubmit();
                                    }
                                }}
                                disabled={submitting}
                                placeholder="댓글을 작성해 보세요..."
                                className="w-full h-10 bg-white border border-[#B7B7B7] rounded-xl px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#002040] transition-shadow disabled:opacity-50"
                            />
                        </div>
                        <Button
                            onClick={handleCommentSubmit}
                            disabled={submitting || !newComment.trim()}
                            className="h-10 px-4 bg-[#002040] hover:bg-[#003060] text-white text-sm font-semibold rounded-xl"
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

