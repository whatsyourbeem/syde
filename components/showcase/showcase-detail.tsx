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
  MoreHorizontal,
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
import { motion, AnimatePresence } from "motion/react";

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
import { useLoginDialog } from "@/context/LoginDialogContext";
import {
  deleteShowcase,
  toggleShowcaseBookmark,
} from "@/app/showcase/showcase-actions";

import { OptimizedShowcase } from "@/lib/queries/showcase-queries";
import ProfileHoverCard from "@/components/common/profile-hover-card";
import { DeleteDialog } from "@/components/showcase/delete-dialog";
import { DeleteSuccessDialog } from "@/components/showcase/delete-success-dialog";

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
  const [direction, setDirection] = useState(0);

  // existing state code...
  const [isDeleting, setIsDeleting] = useState(false);

  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyUrl, setCopyUrl] = useState("");
  const [replyTo, setReplyTo] = useState<{
    parentId: string;
    authorName: string;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);

  // Stats State

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
  const galleryImages = showcase.images || [];

  const handleNextImage = () => {
    if (galleryImages.length > 0) {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const handlePrevImage = () => {
    if (galleryImages.length > 0) {
      setDirection(-1);
      setCurrentImageIndex(
        (prev) => (prev - 1 + galleryImages.length) % galleryImages.length,
      );
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
        setIsDeleting(false); // Only reset if failed
      } else {
        // Redirect immediately to prevent 404 on current page
        router.push("/showcase?deleted=true");
        router.refresh();
      }
    } catch {
      toast.error("오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount((prev: number) => prev + 1);
    queryClient.invalidateQueries({
      queryKey: ["comments", { parentId: showcase.id }],
    });
  };

  const handleCommentDeleted = () => {
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  // --- Real Content for UI ---
  const projectTitle = showcase.name || "제목 없음";
  const projectTagline = showcase.short_description || "설명이 없습니다.";
  const authorRole = showcase.profiles?.tagline || "[JobTitle]";
  const isAuthor = user?.id === showcase.user_id;

  // Combine Author and Members
  const authorMember = {
    id: `author-${showcase.user_id}`,
    userId: showcase.user_id,
    profileData: showcase.profiles,
    name:
      showcase.profiles?.full_name || showcase.profiles?.username || "Unknown",
    role: "author", // Special role for styling
    tagline: showcase.profiles?.tagline,
    username: showcase.profiles?.username || "unknown",
    avatar: showcase.profiles?.avatar_url,
  };

  const otherMembers = (showcase.members || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    profileData: m.profile,
    name: m.profile?.full_name || m.profile?.username || "Unknown",
    role: "member", // Default role since DB has no role column
    tagline: m.profile?.tagline,
    username: m.profile?.username || "unknown",
    avatar: m.profile?.avatar_url,
  }));

  const teamMembers = [authorMember, ...otherMembers];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Title Section: Responsive Layout */}
      {/* Combined Title & Interaction Section */}
      <div className="w-full border-b-[0.5px] border-[#B7B7B7] bg-white px-5 py-8 md:px-8 md:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Title Row (Desktop) */}
          <div className="hidden md:flex flex-row items-start gap-6 w-full min-h-[160px]">
            {/* Chevron left */}
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-11 h-11 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <ChevronLeft className="w-6 h-6 text-[#434343]" strokeWidth={2.5} />
            </button>

            {/* Thumbnail + Content */}
            <div className="flex flex-row items-start gap-[10px] flex-grow">
              {/* Thumbnail (Desktop: 160x160) */}
              <div className="flex-none w-[160px] h-[160px] bg-sydeblue rounded-[10px] overflow-hidden border border-gray-100 relative">
                {showcase.thumbnail_url ? (
                  <Image
                    src={showcase.thumbnail_url}
                    alt={showcase.name || "Showcase"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex flex-col items-start p-[8px_12px] gap-4 w-full flex-grow">
                <div className="flex flex-row items-start gap-[5px] w-full">
                  <h1 className="font-['Pretendard'] text-[28px] font-bold text-black leading-[150%] line-clamp-2">
                    {showcase.name || "제목 없음"}
                  </h1>
                </div>

                {showcase.short_description && (
                  <div className="flex flex-row items-start gap-[5px] w-full">
                    <p className="font-['Pretendard'] text-[16px] font-normal text-black leading-[150%] line-clamp-2">
                      {showcase.short_description}
                    </p>
                  </div>
                )}

                <div className="flex flex-row items-center gap-[5px] w-full h-6">
                  <ProfileHoverCard
                    userId={showcase.user_id}
                    profileData={showcase.profiles}
                  >
                    <div className="flex items-center gap-[5px] cursor-pointer">
                      <div className="relative w-6 h-6 overflow-hidden shrink-0 bg-[#D9D9D9] rounded-full">
                        <Image
                          src={showcase.profiles?.avatar_url || "/default_avatar.png"}
                          alt="author"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-['Pretendard'] text-[14px] font-semibold text-sydeblue leading-[19px] whitespace-nowrap">
                        {showcase.profiles?.full_name ||
                          showcase.profiles?.username}
                      </span>
                      <span className="font-['Pretendard'] text-[12px] font-normal text-[#777777] leading-[17px] truncate flex-grow">
                        {showcase.profiles?.tagline}
                      </span>
                    </div>
                  </ProfileHoverCard>
                </div>
              </div>
            </div>

            {/* More options (Desktop) */}
            <div className="flex-none p-[16px_4px]">
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-[#434343]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => router.push(`/showcase/edit/${showcase.id}`)} className="flex items-center cursor-pointer w-full p-2">
                      <Edit className="mr-2 h-4 w-4" />
                      <span>수정</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 cursor-pointer p-2"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>삭제</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Title Row (Mobile) */}
          <div className="md:hidden flex flex-col w-full gap-4">
            <div className="flex flex-row justify-between items-start w-full mb-2">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-11 h-11 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              >
                <ChevronLeft className="w-6 h-6 text-[#434343]" strokeWidth={2.5} />
              </button>

              <div className="w-[121px] h-[120px] bg-sydeblue rounded-[10px] overflow-hidden border border-gray-100 relative">
                {showcase.thumbnail_url ? (
                  <Image
                    src={showcase.thumbnail_url}
                    alt={showcase.name || "Showcase"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              <div className="w-11 h-11 flex items-center justify-center">
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="hover:bg-gray-100 rounded-lg transition-colors p-2">
                        <MoreHorizontal className="w-6 h-6 text-[#434343]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => router.push(`/showcase/edit/${showcase.id}`)} className="flex items-center cursor-pointer w-full p-2">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>수정</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 cursor-pointer p-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>삭제</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <h1 className="font-['Pretendard'] text-[20px] font-bold text-black leading-tight line-clamp-2">
                  {showcase.name || "제목 없음"}
                </h1>
                {showcase.short_description && (
                  <p className="font-['Pretendard'] font-normal text-[16px] leading-[150%] text-black line-clamp-2">
                    {showcase.short_description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center mt-1">
                <ProfileHoverCard userId={showcase.user_id} profileData={showcase.profiles}>
                  <div className="flex flex-row items-center gap-[5px] h-5 cursor-pointer">
                    <div className="relative w-5 h-5 overflow-hidden shrink-0 bg-[#D9D9D9] rounded-full">
                      <Image
                        src={showcase.profiles?.avatar_url || "/default_avatar.png"}
                        alt="author"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-['Pretendard'] font-semibold text-[14px] text-sydeblue whitespace-nowrap">
                      {showcase.profiles?.full_name ||
                        showcase.profiles?.username}
                    </span>
                    <span className="font-['Pretendard'] font-normal text-[12px] text-[#777777] line-clamp-1">
                      {showcase.profiles?.tagline}
                    </span>
                  </div>
                </ProfileHoverCard>
              </div>
            </div>
          </div>

          {/* Interaction Bar (Shared Container) */}
          <div className="w-full mt-4 md:mt-6">
            <div className="w-full h-[44px] rounded-[12px] flex items-center justify-between px-8 md:px-16 relative">
              <button
                onClick={handleLike}
                className="flex items-center gap-[5px] hover:scale-105 transition-transform"
              >
                <HeartIcon
                  suppressHydrationWarning
                  className={`w-5 h-5 ${hasLiked ? "fill-sydeorange text-sydeorange" : "text-[#777777]"}`}
                />
                <span className="font-['Pretendard'] text-[14px] text-[#777777]">
                  {likesCount}
                </span>
              </button>

              <button className="flex items-center gap-[5px] hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5 text-[#777777]" />
                <span className="font-['Pretendard'] text-[14px] text-[#777777]">
                  {commentsCount}
                </span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-[5px] hover:scale-105 transition-transform"
              >
                <Share className="w-5 h-5 text-[#777777]" />
              </button>

              <button
                onClick={handleBookmark}
                className="flex items-center gap-[5px] hover:scale-105 transition-transform"
              >
                <Bookmark
                  suppressHydrationWarning
                  className={`w-5 h-5 ${hasBookmarked ? "fill-[#FFD60A] text-[#FFD60A]" : "text-[#808080]"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full max-w-full mx-auto bg-white">
        {/* Gallery Section */}
        <div className="w-full h-auto md:h-auto border-b-[0.5px] border-[#B7B7B7] flex justify-center items-center py-8 md:py-10 px-2 lg:px-4 bg-white group hover:cursor-pointer overflow-hidden gap-2 md:gap-4 lg:gap-4 xl:gap-6">
          
          {/* Left Arrow - Fixed width, never shrinks */}
          {galleryImages.length > 1 && (
            <button
              onClick={handlePrevImage}
              className="flex-none flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 p-2"
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-[#404040]" />
            </button>
          )}

          {/* Small Image - Previous Preview - Shrinks and clips from left */}
          {galleryImages.length > 2 && (
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.div
                key={`prev-${(currentImageIndex - 1 + galleryImages.length) % galleryImages.length}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="hidden lg:block flex-1 min-w-0 max-w-[320px] overflow-hidden rounded-r-[12px] rounded-l-none"
              >
                <div className="w-full relative lg:h-[189px] bg-sydeblue">
                  <Image
                    src={
                      galleryImages[(currentImageIndex - 1 + galleryImages.length) % galleryImages.length]
                    }
                    alt="Previous"
                    fill
                    className="object-cover object-right"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-white/30 pointer-events-none" />
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Large Image - Scales down on mobile, fixed 480px on md+ */}
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            <motion.div
              key={`main-${currentImageIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="flex-1 min-w-0 md:flex-none relative w-full h-0 pb-[56.25%] md:pb-0 md:h-[270px] md:w-[480px] bg-sydeblue rounded-[10px] md:rounded-[12px] overflow-hidden"
            >
              {galleryImages[currentImageIndex] ? (
                <Image
                  src={galleryImages[currentImageIndex]}
                  alt="Main"
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-[14px] text-gray-500 flex items-center justify-center h-full">No Image</span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Small Image - Next Preview - Shrinks and clips from right */}
          {galleryImages.length > 1 && (
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.div
                key={`next-${(currentImageIndex + 1) % galleryImages.length}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="hidden lg:block flex-1 min-w-0 max-w-[320px] overflow-hidden rounded-l-[12px] rounded-r-none"
              >
                <div className="w-full relative lg:h-[189px] bg-sydeblue">
                  <Image
                    src={
                      galleryImages[(currentImageIndex + 1) % galleryImages.length]
                    }
                    alt="Next"
                    fill
                    className="object-cover object-left"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-white/30 pointer-events-none" />
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Right Arrow - Fixed width, never shrinks */}
          {galleryImages.length > 1 && (
            <button
              onClick={handleNextImage}
              className="flex-none flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 p-2"
              aria-label="Next Image"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#404040]" />
            </button>
          )}

        </div>

        {/* Club Description Box */}
        <div className="w-full px-5 py-8 md:px-8 md:py-10 flex flex-col gap-6">
          <div className="flex flex-row justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Image
                src="/orange_line.png"
                alt="icon"
                width={26}
                height={26}
                className="object-contain"
              />
              <span className="font-['Pretendard'] font-bold text-[20px] text-sydeblue">
                소개
              </span>
            </div>
          </div>

          <div className="w-full">
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
        <div className="w-full border-t-[0.5px] border-[#B7B7B7] px-5 py-8 md:px-8 md:py-10 flex flex-col gap-4">
          {(() => {
            const hasLinks =
              showcase.web_url || showcase.playstore_url || showcase.appstore_url;

            if (!hasLinks) {
              return (
                <div className="flex items-center justify-center h-[100px] text-gray-400 text-sm">
                  등록된 링크가 없습니다.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Website Links */}
                {showcase.web_url && (
                  <a
                    href={showcase.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 rounded-[12px] h-[46px] w-full bg-alabasterwhite hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-6 h-6 text-black" />
                      <span className="font-['Pretendard'] text-[14px] text-black">
                        웹사이트 방문하기
                      </span>
                    </div>
                    <Share className="w-4 h-6 text-[#808080]" />
                  </a>
                )}

                {/* Google Play */}
                {showcase.playstore_url && (
                  <a
                    href={showcase.playstore_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 rounded-[12px] h-[46px] w-full bg-alabasterwhite hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-black fill-current"
                        viewBox="0 0 512 512"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                      </svg>
                      <span className="font-['Pretendard'] text-[14px] text-black">
                        Google Play에서 다운로드하기
                      </span>
                    </div>
                    <Share className="w-4 h-6 text-[#808080]" />
                  </a>
                )}

                {/* App Store */}
                {showcase.appstore_url && (
                  <a
                    href={showcase.appstore_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 rounded-[12px] h-[46px] w-full bg-alabasterwhite hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-6 h-6 text-black fill-current"
                        viewBox="0 0 64 64"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M49.424 34c-.1-8.1 6.581-12 6.88-12.2a14.581 14.581 0 0 0-11.667-6.3c-4.986-.5-9.672 2.9-12.265 2.9-2.493 0-6.382-2.9-10.57-2.8a15.75 15.75 0 0 0-13.162 8c-5.584 9.8-1.4 24.4 4.088 32.3 2.692 3.9 5.883 8.3 10.071 8.1 4.088-.2 5.584-2.6 10.47-2.6s6.282 2.6 10.57 2.5c4.388-.1 7.08-4 9.772-7.9A31.77 31.77 0 0 0 58 46.9 13.956 13.956 0 0 1 49.424 34zm-8.077-23.8A14.32 14.32 0 0 0 44.638 0a14.075 14.075 0 0 0-9.373 4.8c-2.094 2.4-3.889 6.2-3.39 9.9 3.589.3 7.279-1.8 9.472-4.5z" />
                      </svg>
                      <span className="font-['Pretendard'] text-[14px] text-black">
                        App Store에서 다운로드하기
                      </span>
                    </div>
                    <Share className="w-4 h-6 text-[#808080]" />
                  </a>
                )}
              </div>
            );
          })()}
        </div>

        {/* Participant List */}
        <div className="w-full border-t-[0.5px] border-[#B7B7B7] px-5 py-8 md:px-8 md:py-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/orange_line.png"
              alt="icon"
              width={26}
              height={26}
              className="object-contain"
            />
            <span className="font-['Pretendard'] font-bold text-[20px] text-sydeblue">
              SYDERS의 손 끝에서 탄생했어요.
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {teamMembers.map((member) => (
              <ProfileHoverCard
                key={member.id}
                userId={member.userId}
                profileData={member.profileData}
              >
                <Link href={`/${member.username}`} className="block">
                  <div className="flex flex-col items-center gap-1 w-[128px] h-auto p-2 rounded-[10px] flex-shrink-0 relative bg-alabasterwhite hover:bg-gray-100 transition-colors cursor-pointer group">
                    {/* Crown for Leader/Author (Logic assumption: first member or matches author role) */}
                    {member.role === "author" && (
                      <div className="absolute top-2 left-2 text-sydeorange">
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
                            fill="currentColor"
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
                    <div className="flex flex-col items-center gap-0 w-full">
                      <span className="font-['Pretendard'] font-bold text-[12px] md:text-[14px] text-sydeblue w-full text-center truncate px-1">
                        {member.name}
                      </span>
                      <span className="font-['Pretendard'] text-[12px] text-[#777777] w-full text-center truncate px-1">
                        @{member.username}
                      </span>
                      <span className="font-['Pretendard'] text-[12px] text-[#777777] w-full text-center truncate px-1">
                        {member.tagline ||
                          (member.role === "author" ? "Host" : "Member")}
                      </span>
                    </div>
                  </div>
                </Link>
              </ProfileHoverCard>
            ))}
          </div>
        </div>



        {/* Comments Section */}
        <div className="w-full border-t-[0.5px] border-[#B7B7B7] px-5 py-8 md:px-8 md:py-10 flex flex-col gap-4 mb-20">
          <div className="flex items-center gap-2">
            <Image
              src="/orange_line.png"
              alt="icon"
              width={26}
              height={26}
              className="object-contain"
            />
            <span className="font-['Pretendard'] font-bold text-[20px] text-sydeblue">
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
              onCommentDeleted={handleCommentDeleted}
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

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <DeleteSuccessDialog
        open={showDeleteSuccessDialog}
        onOpenChange={setShowDeleteSuccessDialog}
      />
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
