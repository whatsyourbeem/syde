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
  Share2,
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

type ShowcaseWithRelations =
  Database["public"]["Tables"]["showcases"]["Row"] & {
    profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
    showcase_likes: Array<{ user_id: string }>;
    showcase_bookmarks: Array<{ user_id: string }>;
    showcase_comments: Array<{ id: string }>;
  };

interface ShowcaseDetailProps {
  showcase: ShowcaseWithRelations;
  user: User | null;
}

export function ShowcaseDetail({ showcase, user }: ShowcaseDetailProps) {
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openLoginDialog } = useLoginDialog();

  // --- States ---
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
  const [likesCount, setLikesCount] = useState(showcase.showcase_likes.length);
  const [hasLiked, setHasLiked] = useState(
    user
      ? showcase.showcase_likes.some((like) => like.user_id === user.id)
      : false
  );
  const [bookmarksCount, setBookmarksCount] = useState(
    showcase.showcase_bookmarks.length
  );
  const [hasBookmarked, setHasBookmarked] = useState(
    user
      ? showcase.showcase_bookmarks.some(
          (bookmark) => bookmark.user_id === user.id
        )
      : false
  );
  const [commentsCount, setCommentsCount] = useState(
    showcase.showcase_comments.length
  );

  // Mention State (Legacy support for content rendering)
  const [mentionedProfiles, setMentionedProfiles] = useState<
    Array<{ id: string; username: string | null }>
  >([]);

  useEffect(() => {
    const fetchMentionedProfiles = async () => {
      const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
      const mentionedUserIds = new Set<string>();
      const matches = showcase.content.matchAll(mentionRegex);
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
  }, [showcase.content, supabase]);

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
      previousBookmarked ? previousCount - 1 : previousCount + 1
    );

    const result = await toggleShowcaseBookmark(
      showcase.id,
      previousBookmarked
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
        router.push("/showcase");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount((prev) => prev + 1);
    queryClient.invalidateQueries({
      queryKey: ["comments", { showcaseId: showcase.id }],
    });
  };

  // --- Mock Data for UI ---
  const projectTitle = "일이삼사오육칠팔구십일이삼사..";
  const projectTagline = "이 프로젝트는 어쩌고 저쩌고 그렇습니다..";
  const authorRole = "프로덕트매니저 | 제너럴리스트";

  // Mock Team Members
  const teamMembers = [
    {
      id: "mock1",
      name: showcase.profiles?.full_name || "제이현",
      role: "author",
      username: showcase.profiles?.username || "unknown",
      avatar: showcase.profiles?.avatar_url,
    },
    {
      id: "mock2",
      name: "Nickname",
      role: "member",
      username: "username",
      avatar: null,
    },
    {
      id: "mock3",
      name: "Nickname",
      role: "member",
      username: "username",
      avatar: null,
    },
    {
      id: "mock4",
      name: "Nickname",
      role: "member",
      username: "username",
      avatar: null,
    },
    {
      id: "mock5",
      name: "Nickname",
      role: "member",
      username: "username",
      avatar: null,
    },
  ];

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

      <div className="px-5">
        {/* Header Info */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative w-16 h-16 flex-shrink-0 bg-gray-900 rounded-[14px] flex items-center justify-center overflow-hidden">
            {/* Project Logo Placeholder - Using Author Avatar or Default */}
            {showcase.profiles?.avatar_url ? (
              <Image
                src={showcase.profiles.avatar_url}
                alt="Logo"
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <BoxIcon className="text-white w-8 h-8" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {projectTitle}
            </h1>
            <p className="text-sm text-gray-500 truncate mt-1">
              {projectTagline}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={showcase.profiles?.avatar_url || ""} />
                <AvatarFallback>
                  {showcase.profiles?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-bold text-gray-700">
                {showcase.profiles?.full_name}
              </span>
              <span className="text-[10px] text-gray-400">|</span>
              <span className="text-[10px] text-gray-400 truncate">
                {authorRole}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Action Bar */}
        <div className="flex items-center justify-between bg-gray-50 rounded-[8px] px-6 py-3 mb-6">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
          >
            <HeartIcon
              className={`w-4 h-4 ${
                hasLiked ? "fill-red-500 text-red-500" : ""
              }`}
            />
            <span className="text-xs font-medium">{likesCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{commentsCount}</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleBookmark}
            className="flex items-center gap-1.5 text-gray-500 hover:text-yellow-500 transition-colors"
          >
            <Bookmark
              className={`w-4 h-4 ${
                hasBookmarked ? "fill-yellow-500 text-yellow-500" : ""
              }`}
            />
            <span className="text-xs font-medium">{bookmarksCount}</span>
          </button>
        </div>

        {/* Gallery Section */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          {/* Main Image */}
          <div className="flex-none w-[280px] aspect-video bg-gray-200 rounded-[12px] overflow-hidden relative">
            {showcase.image_url ? (
              <Image
                src={showcase.image_url}
                alt="Main"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-xs">No Image</span>
              </div>
            )}
            {/* Mock Overlay Text from Design */}
            {!showcase.image_url && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-[10px]">
                <p>설명 이미지</p>
                <p>16:9</p>
                <p>480x270</p>
              </div>
            )}
          </div>
          {/* Sub Image (Placeholder) */}
          <div className="flex-none w-[200px] aspect-video bg-gray-200 rounded-[12px] relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-[10px]">
              <p>설명 이미지</p>
              <p>16:9</p>
              <p>320x180</p>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-sm">
              <ChevronLeft className="w-4 h-4 rotate-180 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b-2 border-transparent relative mb-4">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-[#ED6D34] -mb-[2px] z-10">
              <div className="w-4 h-1 bg-[#ED6D34] rounded-full" />
              <span className="font-bold text-lg text-gray-900">소개</span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 pb-2"
            >
              {isExpanded ? "접기" : "펼쳐보기"}
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="border-b border-gray-100 mb-6" />{" "}
          {/* Full width line */}
          {isExpanded && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="font-bold text-sm text-gray-900 mb-2">
                이 앱에 대한 설명
              </h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                {linkifyMentions(showcase.content, mentionedProfiles)}
              </div>
            </div>
          )}
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          <Button
            variant="outline"
            className="h-12 justify-start bg-gray-50 border-gray-100 hover:bg-gray-100 rounded-[12px] gap-3"
          >
            <Globe className="w-5 h-5 text-gray-900" />
            <span className="text-xs font-medium text-gray-600">
              웹사이트 방문하기
            </span>
            <Share2 className="w-4 h-4 text-gray-300 ml-auto" />
          </Button>
          <Button
            variant="outline"
            className="h-12 justify-start bg-gray-50 border-gray-100 hover:bg-gray-100 rounded-[12px] gap-3"
          >
            <Play className="w-5 h-5 fill-gray-900 text-gray-900" />{" "}
            {/* Google Play Icon approx */}
            <span className="text-xs font-medium text-gray-600">
              Google Play에서 다운로드하기
            </span>
            <Share2 className="w-4 h-4 text-gray-300 ml-auto" />
          </Button>
          <Button
            variant="outline"
            className="h-12 justify-start bg-gray-50 border-gray-100 hover:bg-gray-100 rounded-[12px] gap-3"
          >
            <Apple className="w-5 h-5 text-gray-900" />
            <span className="text-xs font-medium text-gray-600">
              App Store에서 다운로드하기
            </span>
            <Share2 className="w-4 h-4 text-gray-300 ml-auto" />
          </Button>
        </div>

        {/* Team Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-1 bg-[#ED6D34] rounded-full" />
            <span className="font-bold text-lg text-gray-900">
              SYDERS의 손 끝에서 탄생했어요.
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-[20px] bg-gray-100 mb-2 overflow-hidden border border-gray-50">
                  <Image
                    src={member.avatar || "/default_avatar.png"}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[12px] font-bold text-gray-900 text-center truncate w-full">
                  {member.name}
                </span>
                <span className="text-[10px] text-gray-400 text-center truncate w-full">
                  @{member.username}
                </span>
                <span className="text-[10px] text-gray-400 text-center mt-0.5">
                  [JobTitle]
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-6" />
        </div>

        {/* Comments Section */}
        <div className="mb-20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-1 bg-[#ED6D34] rounded-full" />
            <span className="font-bold text-lg text-gray-900">
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
