"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  HeartIcon,
  MessageCircle,
  Share,
  Bookmark,
  ChevronLeft,
  MoreVertical,
  Link2,
  Copy,
  Trash2,
  Edit,
  Globe,
  Play,
  Apple,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime, linkifyMentions } from "@/lib/utils";
import { Database } from "@/types/database.types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "@/components/comment/comment-form";
import { CommentList } from "@/components/comment/comment-list";
import { ShowcaseEditDialog } from "@/components/showcase/showcase-edit-dialog";
import { useLoginDialog } from "@/context/LoginDialogContext";
import {
  deleteShowcase,
  toggleShowcaseBookmark,
} from "@/app/showcase/showcase-actions";

import { OptimizedShowcase } from "@/lib/queries/showcase-queries";

type ShowcaseWithRelations = OptimizedShowcase; // Use defined type

interface ShowcaseDetailProps {
  showcase: ShowcaseWithRelations;
  user: User | null;
}

export function ShowcaseDetail({ showcase, user }: ShowcaseDetailProps) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openLoginDialog } = useLoginDialog();

  // Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // existing state code...
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");
  const [replyTo, setReplyTo] = useState<{
    parentId: string;
    authorName: string;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
  } | null>(null);

  // Stats State
  const [likesCount, setLikesCount] = useState(
    showcase.showcase_likes?.length || 0,
  );
  const [hasLiked, setHasLiked] = useState(
    user
      ? showcase.showcase_likes?.some((like: any) => like.user_id === user.id)
      : false,
  );
  const [bookmarksCount, setBookmarksCount] = useState(
    showcase.showcase_bookmarks?.length || 0,
  );
  const [hasBookmarked, setHasBookmarked] = useState(
    user
      ? showcase.showcase_bookmarks?.some(
          (bookmark: any) => bookmark.user_id === user.id,
        )
      : false,
  );
  const [commentsCount, setCommentsCount] = useState(
    showcase.showcase_comments?.length || 0,
  );

  // Gallery Logic
  const galleryImages = showcase.showcases_images
    ? [...showcase.showcases_images].sort(
        (a: any, b: any) => a.display_order - b.display_order,
      )
    : [];

  const handleNextImage = () => {
    if (galleryImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  // Mention State (Legacy support for content rendering)
  const [mentionedProfiles, setMentionedProfiles] = useState<
    Array<{ id: string; username: string | null }>
  >([]);

  useEffect(() => {
    const fetchMentionedProfiles = async () => {
      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      const mentionedUserIds = new Set<string>();
      const textToSearch = `${showcase.short_description || ""} ${
        showcase.description || ""
      }`;
      const matches = textToSearch.matchAll(mentionRegex);
      for (const match of matches) {
        mentionedUserIds.add(match[1]);
      }

      if (mentionedUserIds.size > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", Array.from(mentionedUserIds));
        setMentionedProfiles(data || []);
      }
    };
    fetchMentionedProfiles();
  }, [showcase.description, showcase.short_description, supabase]);

  // --- Actions ---
  const handleLike = async () => {
    if (!user?.id) return openLoginDialog();

    const previousLiked = hasLiked;
    const previousCount = likesCount;

    setHasLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    if (previousLiked) {
      const { error } = await supabase
        .from("showcase_likes")
        .delete()
        .eq("showcase_id", showcase.id)
        .eq("user_id", user.id);
      if (error) {
        setHasLiked(previousLiked);
        setLikesCount(previousCount);
      }
    } else {
      const { error } = await supabase
        .from("showcase_likes")
        .insert({ showcase_id: showcase.id, user_id: user.id });
      if (error) {
        setHasLiked(previousLiked);
        setLikesCount(previousCount);
      }
    }
  };

  const handleBookmark = async () => {
    if (!user?.id) return openLoginDialog();

    const previousBookmarked = hasBookmarked;
    const previousCount = bookmarksCount;

    setHasBookmarked(!previousBookmarked);
    setBookmarksCount(
      previousBookmarked ? previousCount - 1 : previousCount + 1,
    );

    const result = await toggleShowcaseBookmark(
      showcase.id,
      previousBookmarked,
    );
    if ("error" in result && result.error) {
      toast.error(result.error.message);
      setHasBookmarked(previousBookmarked);
      setBookmarksCount(previousCount);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/showcase/${showcase.id}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast.success("링크를 복사했어요!");
      } else {
        throw new Error("Clipboard not supported");
      }
    } catch {
      setCopyUrl(url);
      setShowCopyDialog(true);
    }
  };

  const handleDelete = async () => {
    if (user?.id !== showcase.user_id) return;
    setIsDeleting(true);
    try {
      const result = await deleteShowcase(showcase.id);
      if (result && "error" in result) {
        toast.error("쇼케이스 삭제 실패");
      } else {
        toast.success("쇼케이스가 삭제되었습니다.");
        await queryClient.invalidateQueries({ queryKey: ["showcases"] });
        router.push("/showcase");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount((prev: number) => prev + 1);
    queryClient.invalidateQueries({
      queryKey: ["comments", { parentId: showcase.id }],
    });
  };

  // --- Real Content for UI ---
  const projectTitle = showcase.name || "제목 없음";
  const projectTagline = showcase.short_description || "설명이 없습니다.";
  const authorRole = showcase.profiles?.tagline || "[JobTitle]";

  // Combine Author and Members
  const authorMember = {
    id: `author-${showcase.user_id}`,
    name:
      showcase.profiles?.full_name || showcase.profiles?.username || "Unknown",
    role: "author", // Special role for styling
    username: showcase.profiles?.username || "unknown",
    avatar: showcase.profiles?.avatar_url,
  };

  const otherMembers = (showcase.members || []).map((m) => ({
    id: m.id,
    name: m.profile?.full_name || m.profile?.username || "Unknown",
    role: "member", // Default role since DB has no role column
    username: m.profile?.username || "unknown",
    avatar: m.profile?.avatar_url,
  }));

  const teamMembers = [authorMember, ...otherMembers];

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-white z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Author Actions (Edit/Delete) */}
        {user?.id === showcase.user_id && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ShowcaseEditDialog
                  userId={user?.id || null}
                  avatarUrl={showcase.profiles?.avatar_url || null}
                  username={showcase.profiles?.username || null}
                  full_name={showcase.profiles?.full_name || null}
                  initialShowcaseData={showcase}
                  onSuccess={() => router.refresh()}
                >
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>수정</span>
                  </DropdownMenuItem>
                </ShowcaseEditDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-500 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>삭제</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex flex-col items-center w-full max-w-[850px] mx-auto  bg-white">
        {/* Header Section (Title + Thumbnail) */}
        <div className="w-full flex flex-col md:flex-row items-start p-4 md:p-5 gap-6 md:gap-[132px] justify-between">
          <div className="flex-1 flex flex-row items-center gap-6 w-full">
            {/* Thumbnail Image (100x100) */}
            <div className="flex-none w-[100px] h-[100px] bg-gray-100 rounded-[10px] overflow-hidden border border-gray-100 relative">
              {showcase.thumbnail_url ? (
                <Image
                  src={showcase.thumbnail_url}
                  alt={projectTitle}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <BoxIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Title & Info */}
            <div className="flex flex-col justify-center gap-[5px] flex-1">
              <h1 className="font-['Pretendard'] font-bold text-[22px] md:text-[28px] leading-[150%] text-black line-clamp-2">
                {projectTitle}
              </h1>
              <p className="font-['Pretendard'] text-[14px] leading-[150%] text-black line-clamp-1">
                {projectTagline}
              </p>

              {/* Profile */}
              <div className="flex items-center gap-[5px] mt-[1px]">
                <Avatar className="w-[20px] h-[20px]">
                  <AvatarImage src={showcase.profiles?.avatar_url || ""} />
                  <AvatarFallback className="text-[8px] bg-[#D9D9D9]">
                    {showcase.profiles?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-['Pretendard'] font-semibold text-[12px] text-[#002040]">
                  {showcase.profiles?.full_name || showcase.profiles?.username}
                </span>
                <span className="font-['Pretendard'] text-[11px] text-[#777777]">
                  | {authorRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="w-full px-4 md:px-8 py-3">
          <div className="w-full h-[44px] bg-[#FAFAFA] rounded-[12px] flex items-center justify-between px-6 md:px-12 relative">
            {/* Like */}
            <button
              onClick={handleLike}
              className="flex items-center gap-[5px] hover:scale-105 transition-transform"
            >
              <HeartIcon
                suppressHydrationWarning
                className={`w-[18px] h-[17px] ${hasLiked ? "fill-[#ED6D34] text-[#ED6D34]" : "text-[#777777]"}`}
              />
              <span className="font-['Pretendard'] text-[14px] text-[#777777]">
                {likesCount}
              </span>
            </button>

            {/* Comment */}
            <button className="flex items-center gap-[5px] hover:scale-105 transition-transform">
              <MessageCircle className="w-[18px] h-[16px] text-[#777777]" />
              <span className="font-['Pretendard'] text-[14px] text-[#777777]">
                {commentsCount}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Share className="w-[14px] h-[20px] text-[#808080]" />
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className="flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Bookmark
                suppressHydrationWarning
                className={`w-[10px] h-[16px] ${hasBookmarked ? "fill-[#FFD60A] text-[#FFD60A]" : "text-[#808080]"}`}
              />
            </button>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="w-full h-[294px] border-t-[0.5px] border-[#B7B7B7] flex items-center px-[32px] py-[12px] overflow-hidden">
          {/* Large Image (480x270) */}
          <div
            key={galleryImages[currentImageIndex]?.id || "main-empty"}
            className="flex-none w-[480px] h-[270px] bg-[#B7B7B7] rounded-[12px] relative overflow-hidden flex items-center justify-center animate-in fade-in slide-in-from-right-8 duration-500"
          >
            {galleryImages[currentImageIndex] ? (
              <Image
                src={galleryImages[currentImageIndex].image_url}
                alt="Main"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-[14px] text-gray-500">No Image</span>
            )}
          </div>

          {/* Arrow */}
          {galleryImages.length > 1 && (
            <button
              onClick={handleNextImage}
              className="flex-none w-[26px] h-[30px] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 rounded mx-[10px]"
            >
              <ChevronRight className="w-[10px] h-[14px] text-[#808080]" />
            </button>
          )}

          {/* Small Image (320x180) - Next Preview */}
          {galleryImages.length > 1 && (
            <div
              key={
                galleryImages[(currentImageIndex + 1) % galleryImages.length]
                  ?.id || "next-empty"
              }
              className="flex-none w-[320px] h-[180px] bg-[#B7B7B7] rounded-[12px] relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500"
            >
              <Image
                src={
                  galleryImages[(currentImageIndex + 1) % galleryImages.length]
                    .image_url
                }
                alt="Next"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Club Description Box */}
        <div className="w-full border-t-[0.5px] border-[#B7B7B7] px-4 py-5 flex flex-col gap-6">
          <div className="flex flex-row justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Image
                src="/orange_line.png"
                alt="icon"
                width={26}
                height={26}
                className="object-contain"
              />
              <span className="font-['Pretendard'] font-bold text-[20px] text-[#002040]">
                소개
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-[12px] text-[#777777]"
            >
              {isExpanded ? "접기" : "펼쳐보기"}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div
            className={`w-full overflow-hidden transition-all ${isExpanded ? "max-h-none opacity-100" : "max-h-0 opacity-0"}`}
          >
            <h3 className="font-['Pretendard'] font-bold text-[16px] leading-[19px] text-black mb-2 whitespace-pre-wrap">
              이 앱에 대한 설명
            </h3>
            {(() => {
              let content = showcase.description || "";
              const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
              const processedContent = content.replace(
                mentionRegex,
                (match, userId) => {
                  const profile = mentionedProfiles.find(
                    (p) => p.id === userId,
                  );
                  const username = profile ? profile.username : "unknown";
                  return `<a href="/${username}" class="text-blue-500 hover:underline font-semibold" target="_self">@${username}</a>`;
                },
              );

              return (
                <div
                  className="text-[14px] leading-[150%] text-black link-reset"
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />
              );
            })()}
          </div>
        </div>

        {/* Links Section */}
        <div className="w-full border-t-[0.5px] border-[#B7B7B7] p-4 flex flex-col gap-2">
          {/* Website */}
          {showcase.showcases_links
            ?.filter((l: any) => l.type === "website")
            .map((link: any) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-2 bg-[#FAFAFA] rounded-[12px] h-[46px] w-full max-w-[400px]"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6" />
                  <span className="font-['Pretendard'] text-[14px] text-black">
                    웹사이트 방문하기
                  </span>
                </div>
                <Share className="w-4 h-6 text-[#808080]" />
              </a>
            ))}
          {(!showcase.showcases_links ||
            showcase.showcases_links.length === 0) && (
            <div className="flex items-center justify-center h-[100px] text-gray-400 text-sm">
              등록된 링크가 없습니다.
            </div>
          )}
        </div>

        {/* Participant List */}
        <div className="w-full border-t-[0.5px] border-[#B7B7B7] px-4 py-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[24px]">🛠️</span>
            <span className="font-['Pretendard'] font-bold text-[20px] text-[#002040]">
              SYDERS의 손 끝에서 탄생했어요.
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col items-center justify-center gap-1 w-[128px] h-[118px] bg-[#FAFAFA] rounded-[10px] flex-shrink-0 relative"
              >
                {/* Crown for Leader/Author (Logic assumption: first member or matches author role) */}
                {member.role === "author" && (
                  <div className="absolute top-2 left-2 text-[#ED6D34]">
                    {/* Crown Icon placeholder or small customized svg */}
                    <svg
                      width="20"
                      height="16"
                      viewBox="0 0 20 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 16C1.12188 16 0 14.8781 0 13.5V2.5C0 1.12188 1.12188 0 2.5 0H17.5C18.8781 0 20 1.12188 20 2.5V13.5C20 14.8781 18.8781 16 17.5 16H2.5Z"
                        fill="white"
                        fillOpacity="0.01"
                      />
                      <path
                        d="M10 0.240234L12.93 5.92023L19.55 6.75023L14.66 11.3902L15.93 17.7602L10 14.4902L4.07 17.7602L5.34 11.3902L0.45 6.75023L7.07 5.92023L10 0.240234Z"
                        fill="#ED6D34"
                      />
                    </svg>
                  </div>
                )}

                <div className="relative w-[48px] h-[48px]">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={member.avatar || ""} />
                    <AvatarFallback className="bg-[#D9D9D9]">
                      {member.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="font-['Pretendard'] font-bold text-[12px] text-[#002040] w-full text-center truncate px-1">
                  {member.name}
                </span>
                <span className="font-['Pretendard'] text-[12px] text-[#777777] w-full text-center truncate px-1">
                  @{member.username}
                </span>
                <span className="font-['Pretendard'] text-[12px] text-[#777777] w-full text-center truncate px-1">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="w-full border-t-[0.5px] border-[#B7B7B7] px-8 py-5 flex flex-col gap-4 mb-20">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#002040]" />
            <span className="font-['Pretendard'] font-bold text-[20px] text-[#002040]">
              댓글 및 리뷰
            </span>
          </div>

          <div className="space-y-6">
            <CommentList
              showcaseId={showcase.id}
              currentUserId={user?.id || null}
              pageSize={10}
              isDetailPage={true}
              setReplyTo={setReplyTo}
            />
            <CommentForm
              showcaseId={showcase.id}
              currentUserId={user?.id || null}
              onCommentAdded={handleCommentAdded}
              replyTo={replyTo}
            />
          </div>
        </div>
      </div>

      {/* Copy Link Dialog */}
      <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <AlertDialogContent className="w-[350px] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>링크 복사</AlertDialogTitle>
            <AlertDialogDescription>
              수동으로 복사해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={copyUrl}
              className="w-full p-2 border rounded bg-muted text-muted-foreground flex-grow"
              onFocus={(e) => e.target.select()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowCopyDialog(false)}>
              닫기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Icon Helper
function BoxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
