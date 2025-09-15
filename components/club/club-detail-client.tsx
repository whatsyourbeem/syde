"use client";

import { useState } from "react";
import { Tables, Enums } from "@/types/database.types";
import {
  MEETUP_STATUSES,
  MEETUP_STATUS_DISPLAY_NAMES,
} from "@/lib/constants";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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


import { Badge } from "@/components/ui/badge";
import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from "@/lib/constants";

import ClubPostList from "./club-post-list"; // Import ClubPostList
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ClubSidebarInfo from "./club-sidebar-info"; // Import ClubSidebarInfo
import ClubMembersList from "./club-members-list"; // Import ClubMembersList
import Image from "next/image";

// Type Definitions
type Profile = Tables<"profiles">;
type Meetup = Tables<"meetups"> & { organizer_profile: Profile | null };
type ClubMember = Tables<"club_members"> & { profiles: Profile | null };

type ClubForumPost = Tables<"club_forum_posts"> & { author: Profile | null };

type ForumWithPosts = Tables<"club_forums"> & { posts: ClubForumPost[] };

type Club = Tables<"clubs"> & {
  owner_profile: Profile | null;
  members: ClubMember[];
  meetups: Meetup[];
  forums: ForumWithPosts[];
};

interface ClubDetailClientProps {
  club: Club;
  isMember: boolean;
  currentUserId?: string;
  userRole: string | null;
  isOwner: boolean;
}

// Helper Functions for Meetup Card
function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);

  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  

  return `${year}.${month}.${day}(${weekday})`;
}

function getStatusBadgeClass(status: Enums<"meetup_status_enum">) {
  switch (status) {
    case MEETUP_STATUSES.UPCOMING:
      return "border-gray-400 bg-gray-100 text-gray-700 px-2 w-15";
    case MEETUP_STATUSES.APPLY_AVAILABLE:
      return "border-green-500 bg-green-50 text-green-700 px-2 w-15";
    case MEETUP_STATUSES.APPLY_CLOSED:
      return "border-red-500 bg-red-50 text-red-700 px-2 w-15";
    case MEETUP_STATUSES.ENDED:
      return "border-gray-500 bg-gray-50 text-gray-700 px-2 w-10";
    default:
      return "border-gray-500 bg-gray-50 text-gray-700";
  }
}



// Main Component
export default function ClubDetailClient({
  club,
  isMember,
  currentUserId,
  userRole,
  isOwner,
}: ClubDetailClientProps) {
  const [activeForumId, setActiveForumId] = useState(club.forums[0]?.id || "");

  const canReadForum = (forum: ForumWithPosts) => {
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

  const canWriteForum = (forum: ForumWithPosts | undefined) => {
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

  const activeForum = club.forums.find((f) => f.id === activeForumId);

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
                  members={club.members}
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
            members={
              club.members.length > 6 ? club.members.slice(0, 6) : club.members
            }
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
            <Link href={`/socialing/club/${club.id}/meetup`}>
              <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                모두 보기
              </Button>
            </Link>
          </div>
        </div>
        {club.meetups.length > 0 ? (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex space-x-4 px-4">
              {club.meetups.map((meetup) => (
                <div
                  key={meetup.id}
                  className="w-[240px] flex-shrink-0"
                >
                  <div className="p-1 h-full">
                    <Card className="h-full transition-shadow hover:shadow-lg overflow-hidden">
                      <CardContent className="flex flex-col p-0 h-full">
                        <div className="w-full h-[160px] relative overflow-hidden rounded-t-lg">
                          <Image
                            src={meetup.thumbnail_url || "/default_meetup_thumbnail.png"}
                            alt={meetup.title}
                            fill
                            className="object-cover object-center"
                          />
                          <div className="absolute top-2 left-3">
                            <Badge className={`${getStatusBadgeClass(meetup.status)} text-xs`}>
                              {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
                            </Badge>
                          </div>
                          
                        </div>
                        <div className="flex flex-col flex-grow p-4">
                          <Link
                            href={`/socialing/meetup/${meetup.id}`}
                            className="w-full flex flex-col flex-grow"
                          >
                            <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                              {meetup.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2"> {/* Organizer Info */}
                                <Avatar className="size-5">
                                  <AvatarImage
                                    src={
                                      meetup.organizer_profile?.avatar_url ||
                                      undefined
                                    }
                                  />
                                  <AvatarFallback>
                                    {meetup.organizer_profile?.username?.charAt(
                                      0
                                    ) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">
                                  {meetup.organizer_profile?.full_name ||
                                    meetup.organizer_profile?.username}
                                </span>
                              </div>
                            <div className="text-xs text-muted-foreground"> {/* Date and Location Info */}
                              {meetup.start_datetime && (
                                <span>
                                  {formatDate(meetup.start_datetime)}
                                </span>
                              )}
                              {meetup.location && (
                                <span>
                                  {" | "}
                                  {meetup.location}
                                </span>
                              )}
                            </div>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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
        {club.forums && club.forums.length > 0 ? (
          <Tabs
            defaultValue={activeForumId}
            className="w-full"
            onValueChange={setActiveForumId}
          >
            <div className="flex flex-col gap-4 mb-4 md:flex-row md:justify-between md:items-center">
              <TabsList className="overflow-x-auto whitespace-nowrap scrollbar-hide">
                {club.forums.map((forum) => (
                  <TabsTrigger key={forum.id} value={forum.id}>
                    {forum.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2 self-end md:self-center">
                {canWriteForum(activeForum) && (
                  <Link
                    href={`/socialing/club/${club.id}/post/create?forum_id=${activeForumId}`}
                  >
                    <Button variant="outline" size="sm">새 글 작성</Button>
                  </Link>
                )}
              </div>
            </div>

            {club.forums.map((forum) => (
              <TabsContent key={forum.id} value={forum.id}>
                {canReadForum(forum) ? (
                  <ClubPostList posts={forum.posts} clubId={club.id} />
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
