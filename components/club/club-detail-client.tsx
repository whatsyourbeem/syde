"use client";

import { useState, useEffect } from "react";
import { Tables } from "@/types/database.types";

import TiptapViewer from "@/components/common/tiptap-viewer";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from "@/lib/constants";

import ClubPostList from "./club-post-list"; // Import ClubPostList
import { getPaginatedClubPosts } from "@/app/club/club-post-actions"; // Import the new server action
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Separator } from "@/components/ui/separator";
import ClubSidebarInfo from "./club-sidebar-info"; // Import ClubSidebarInfo
import ClubMembersList from "./club-members-list"; // Import ClubMembersList

import MeetupCard from "@/components/meetup/meetup-card";

// Type Definitions
type Profile = Tables<"profiles">;
type Meetup = Omit<Tables<"meetups">, "type"> & {
  organizer_profile: Profile | null;
  clubs: Tables<"clubs"> | null;
};
type ClubMember = Tables<"club_members"> & { profiles: Profile | null };

type ClubForumPost = Tables<"club_forum_posts"> & { author: Profile | null };



interface ClubDetailClientProps {
  club: Tables<"clubs"> & { owner_profile: Profile | null };
  members: ClubMember[];
  meetups: Meetup[];
  forums: Tables<"club_forums">[];
  isMember: boolean;
  currentUserId?: string;
  userRole: string | null;
  isOwner: boolean;
}

// Main Component
export default function ClubDetailClient({
  club,
  members,
  meetups,
  forums,
  isMember,
  currentUserId,
  userRole,
  isOwner,
}: ClubDetailClientProps) {
  const [activeForumId, setActiveForumId] = useState(forums[0]?.id || "");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10; // Constant for posts per page

  const [paginatedPosts, setPaginatedPosts] = useState<ClubForumPost[]>([]);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const canReadForum = (forum: Tables<"club_forums">) => {
    const permission = forum.read_permission;
    if (permission === CLUB_PERMISSION_LEVELS.PUBLIC) {
      return true;
    }
    if (permission === CLUB_PERMISSION_LEVELS.MEMBER) {
      return isMember;
    }
    if (permission === CLUB_PERMISSION_LEVELS.FULL_MEMBER) {
      return (
        userRole === CLUB_MEMBER_ROLES.FULL_MEMBER ||
        userRole === CLUB_MEMBER_ROLES.LEADER
      );
    }
    if (permission === CLUB_PERMISSION_LEVELS.LEADER) {
      return userRole === CLUB_MEMBER_ROLES.LEADER;
    }
    return false;
  };

  const canWriteForum = (forum: Tables<"club_forums"> | undefined) => {
    if (!forum || !isMember) return false;
    const permission = forum.write_permission;
    if (permission === CLUB_PERMISSION_LEVELS.MEMBER) {
      return true;
    }
    if (permission === CLUB_PERMISSION_LEVELS.FULL_MEMBER) {
      return (
        userRole === CLUB_MEMBER_ROLES.FULL_MEMBER ||
        userRole === CLUB_MEMBER_ROLES.LEADER
      );
    }
    if (permission === CLUB_PERMISSION_LEVELS.LEADER) {
      return userRole === CLUB_MEMBER_ROLES.LEADER;
    }
    return false;
  };

  const activeForum = forums.find((f) => f.id === activeForumId);

  useEffect(() => {
    if (!activeForumId) {
      setPaginatedPosts([]);
      setTotalPostsCount(0);
      return;
    }

    const fetchPosts = async () => {
      setIsLoadingPosts(true);
      const { posts, totalCount } = await getPaginatedClubPosts(
        activeForumId,
        currentPage,
        postsPerPage
      );
      setPaginatedPosts(posts);
      setTotalPostsCount(totalCount);
      setIsLoadingPosts(false);
    };

    fetchPosts();
  }, [activeForumId, currentPage, postsPerPage]);

  return (
    <div className="relative">
      {" "}
      {/* Added relative positioning */}
      <div className="block md:hidden">
        {" "}
        {/* Visible only on mobile */}
        <ClubSidebarInfo
          clubName={club.name}
          clubTagline={club.tagline || undefined}
          clubId={club.id}
          clubThumbnailUrl={club.thumbnail_url || undefined}
          ownerProfile={club.owner_profile}
          isMember={isMember}
          currentUserId={currentUserId}
          userRole={userRole}
          isOwner={isOwner}
        />
      </div>
      <Separator className="mb-4 md:hidden" />
      {/* Mobile-only horizontal scrollable member list */}
      <div className="block md:hidden w-full">
        {" "}
        {/* Added w-full py-8 for consistent spacing */}
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-2xl font-bold">
            👥<span className="font-extrabold pl-2">멤버</span>
          </h2>
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                모두보기
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-full w-full flex flex-col">
              <DrawerHeader>
                <DrawerTitle>클럽 멤버 전체 보기</DrawerTitle>
                <DrawerDescription>
                  이 클럽의 모든 멤버 목록입니다.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 overflow-y-auto">
                <ClubMembersList
                  clubId={club.id}
                  members={members}
                  clubOwnerId={club.owner_id}
                  currentUserId={currentUserId}
                  direction="vertical"
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <div className="px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <ClubMembersList
            clubId={club.id}
            members={members}
            clubOwnerId={club.owner_id}
            currentUserId={currentUserId}
            direction="horizontal"
          />
        </div>
      </div>
      <Separator className="m-0 md:hidden" />
      {/* Description Section */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="description">
          <AccordionTrigger
            className="text-2xl font-bold px-4 py-4"
            showDetailText={true}
          >
            <h2 className="flex items-baseline gap-1">
              💬<span className="font-extrabold pl-1">소개</span>
            </h2>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm dark:prose-invert max-w-none px-6 pt-0 pb-6">
            {club.description ? (
              <TiptapViewer content={club.description} />
            ) : (
              <p className="text-muted-foreground">
                클럽 설명이 아직 없습니다.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator className="mb-4" />

      {/* Meetups Section */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-2xl font-bold">
            🤝<span className="font-extrabold pl-2">모임</span>
          </h2>
          <div className="flex items-center gap-2">
            <Link href={`/club/${club.id}/meetup`}>
              <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                모두 보기
              </Button>
            </Link>
          </div>
        </div>
        {meetups.length > 0 ? (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex space-x-4 px-4">
              {meetups.map((meetup) => (
                <div
                  key={meetup.id}
                  className="w-[240px] flex-shrink-0"
                >
                  <MeetupCard meetup={meetup} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground px-4">
            <p>이 클럽에서 주최하는 모임이 아직 없습니다.</p>
          </div>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Board Section */}
      <div className="w-full px-4">
        <h2 className="text-2xl font-bold mb-4">
          📌<span className="font-extrabold pl-2">게시판</span>
        </h2>
        {forums && forums.length > 0 ? (
          <Tabs
            defaultValue={activeForumId}
            className="w-full"
            onValueChange={setActiveForumId}
          >
            <div className="flex flex-col gap-4 mb-4 md:flex-row md:justify-between md:items-center">
              <TabsList className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                {forums.map((forum) => (
                  <TabsTrigger key={forum.id} value={forum.id} className="text-xs">
                    {forum.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2 self-end md:self-center">
                {canWriteForum(activeForum) && (
                  <Link
                    href={`/club/${club.id}/post/create?forum_id=${activeForumId}`}
                  >
                    <Button variant="outline" size="sm">새 글 작성</Button>
                  </Link>
                )}
              </div>
            </div>

            {forums.map((forum) => (
              <TabsContent key={forum.id} value={forum.id}>
                {canReadForum(forum) ? (
                  <ClubPostList posts={paginatedPosts} clubId={club.id} currentPage={currentPage} postsPerPage={postsPerPage} totalPostsCount={totalPostsCount} onPageChange={setCurrentPage} isLoading={isLoadingPosts} />
                ) : (
                  <div className="p-8 text-center rounded-lg">
                    <p className="text-muted-foreground">
                      이 게시판의 글 목록을 볼 수 있는 권한이 없습니다.
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>이 클럽에는 아직 게시판이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
