"use client";

import { useState, useTransition } from "react";
import { Star, Trash2, Edit2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CertifiedBadge } from "@/components/ui/certified-badge";
import { toast } from "sonner";
import {
  createMeetupReview,
  updateMeetupReview,
  deleteMeetupReview,
} from "@/app/meetup/meetup-actions";
import Link from "next/link";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { formatRelativeTime } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  certified: boolean | null;
  tagline: string | null;
  updated_at: string | null;
}

interface Review {
  id: string;
  meetup_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}

interface MeetupReviewsProps {
  meetupId: string;
  reviews: Review[];
  isApprovedParticipant: boolean;
  user: any; // Supabase user
}

export default function MeetupReviews({
  meetupId,
  reviews,
  isApprovedParticipant,
  user,
}: MeetupReviewsProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editHoverRating, setEditHoverRating] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const [isPending, startTransition] = useTransition();

  // Calculate statistics
  const totalReviews = reviews.length;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("후기 내용을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      const result = await createMeetupReview(meetupId, rating, content);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("후기가 성공적으로 등록되었습니다!");
        setContent("");
        setRating(5);
      }
    });
  };

  const handleStartEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditHoverRating(null);
  };

  const handleUpdateReview = (reviewId: string) => {
    if (!editContent.trim()) {
      toast.error("후기 내용을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      const result = await updateMeetupReview(
        reviewId,
        meetupId,
        editRating,
        editContent
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("후기가 수정되었습니다!");
        setEditingReviewId(null);
      }
    });
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!confirm("정말 이 후기를 삭제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await deleteMeetupReview(reviewId, meetupId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("후기가 삭제되었습니다.");
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6 py-4">

      {/* Review Writing Form */}
      {isApprovedParticipant ? (
        <form
          onSubmit={handleSubmitReview}
          className="border rounded-2xl p-5 md:p-6 bg-white shadow-sm flex flex-col gap-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-black">
                모임은 어떠셨나요? 후기를 작성해보세요!
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                모임에 참가한 멤버만 소중한 후기를 작성할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-700 mr-1.5">
                평점 선택
              </span>
              <div className="flex items-center gap-1 text-sydeorange">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={isPending}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`size-6 cursor-pointer transition-colors ${
                        star <= (hoverRating ?? rating)
                          ? "fill-sydeorange text-sydeorange"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="모임 분위기, 배운 점, 아쉬웠던 점 등 솔직한 후기를 남겨주시면 다른 멤버들에게 큰 도움이 됩니다."
              disabled={isPending}
              rows={3}
              className="w-full text-sm resize-none focus-visible:ring-1 focus-visible:ring-sydeorange border-gray-200 rounded-xl"
            />
            <div className="flex justify-end mt-1">
              <Button
                type="submit"
                disabled={isPending || !content.trim()}
                className="bg-black hover:bg-gray-800 text-white rounded-xl h-10 px-5 text-sm font-semibold transition-all shadow-sm"
              >
                {isPending ? "등록 중..." : "후기 등록하기"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        user && (
          <div className="flex items-center gap-3 border rounded-xl p-4 bg-sydeorange/10 text-sydeorange text-sm">
            <AlertCircle className="size-5 flex-shrink-0 text-sydeorange" />
            <p className="font-medium">
              모임에 참가한 멤버만 소중한 후기를 작성할 수 있습니다.
            </p>
          </div>
        )
      )}

      {/* Reviews List */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-lg font-bold text-black border-b pb-2">
          전체 후기 ({totalReviews})
        </h3>

        {totalReviews > 0 ? (
          <div className="flex flex-col gap-4 divider-y">
            {reviews.map((review) => {
              const isOwner = user && review.user_id === user.id;
              const isEditing = editingReviewId === review.id;

              return (
                <div
                  key={review.id}
                  className="flex gap-3 border-b last:border-b-0 pb-5 last:pb-0"
                >
                  <div className="flex-grow flex flex-col gap-1.5 min-w-0">
                    {/* Reviewer Header (Feed style) */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start min-w-0">
                        <ProfileHoverCard userId={review.user_id} profileData={review.profiles as any}>
                          <div className="flex items-start cursor-pointer min-w-0">
                            <Link href={`/${review.profiles?.username || review.user_id}`} className="shrink-0 mr-2">
                              <Avatar className="size-9">
                                <AvatarImage
                                  src={review.profiles?.avatar_url
                                    ? `${review.profiles.avatar_url}?t=${review.profiles.updated_at ? new Date(review.profiles.updated_at).getTime() : ""}`
                                    : undefined
                                  }
                                  alt={`${review.profiles?.username || "User"}'s avatar`}
                                  className="object-cover"
                                />
                                <AvatarFallback className="text-xs">
                                  {(review.profiles?.full_name || review.profiles?.username || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <div className="flex-grow min-w-0 overflow-hidden flex flex-col gap-0.5">
                              <div className="flex items-baseline gap-1 overflow-hidden">
                                <Link href={`/${review.profiles?.username || review.user_id}`} className="flex-shrink-0">
                                  <div className="flex items-center gap-1">
                                    <p className="font-semibold hover:underline text-sm md:text-log-content">
                                      {review.profiles?.full_name ||
                                        review.profiles?.username ||
                                        "알 수 없음"}
                                    </p>
                                    {review.profiles?.certified && <CertifiedBadge size="sm" />}
                                  </div>
                                </Link>
                                {review.profiles?.tagline && (
                                  <p className="text-xs text-muted-foreground flex-grow min-w-0 truncate">{review.profiles.tagline}</p>
                                )}
                              </div>
                              {/* Stars */}
                              {!isEditing && (
                                <div className="flex items-center gap-0.5 text-sydeorange mt-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`size-3.5 ${
                                        star <= review.rating
                                          ? "fill-sydeorange"
                                          : "text-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </ProfileHoverCard>
                        <p className="text-xs text-muted-foreground flex-shrink-0 ml-1 mt-[2px] md:mt-[3px]">
                          ·&nbsp;&nbsp;{review.created_at ? formatRelativeTime(review.created_at) : ""}
                        </p>
                      </div>

                      {isOwner && !isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(review)}
                            disabled={isPending}
                            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                            title="수정"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content / Editing mode */}
                    {isEditing ? (
                      <div className="flex flex-col gap-3 border rounded-xl p-4 mt-1 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500">
                            수정 평점
                          </span>
                          <div className="flex items-center gap-0.5 text-sydeorange">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditRating(star)}
                                onMouseEnter={() => setEditHoverRating(star)}
                                onMouseLeave={() => setEditHoverRating(null)}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                              >
                                <Star
                                  className={`size-5 cursor-pointer ${
                                    star <= (editHoverRating ?? editRating)
                                      ? "fill-sydeorange text-sydeorange"
                                      : "text-gray-200"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          disabled={isPending}
                          rows={2}
                          className="w-full text-sm resize-none bg-white border-gray-200 rounded-lg focus-visible:ring-1 focus-visible:ring-sydeorange"
                        />

                        <div className="flex justify-end gap-2 text-xs">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={handleCancelEdit}
                            className="rounded-lg h-8 border-gray-300 px-3 hover:bg-gray-100"
                          >
                            <X className="size-3.5 mr-1" /> 취소
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending || !editContent.trim()}
                            onClick={() => handleUpdateReview(review.id)}
                            className="bg-black hover:bg-gray-800 text-white rounded-lg h-8 px-3"
                          >
                            {isPending ? "저장 중..." : "수정완료"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                        {review.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-2xl py-12 px-4 bg-gray-50/30 text-center gap-3">
            <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <Star className="size-6 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">작성된 후기가 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">
                이 모임의 첫 번째 생생한 목소리를 남겨주세요!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
