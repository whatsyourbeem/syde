"use client";

import { useState } from "react";
import { Tables, Enums } from "@/types/database.types";
import {
  MEETUP_CATEGORIES,
  MEETUP_LOCATION_TYPES,
  MEETUP_STATUSES,
  MEETUP_CATEGORY_DISPLAY_NAMES,
  MEETUP_LOCATION_TYPE_DISPLAY_NAMES,
  MEETUP_STATUS_DISPLAY_NAMES,
} from "@/lib/constants";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

import { Clock, MapPin, Users } from "lucide-react";
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
import ClubSidebarInfo from "./club-sidebar-info"; // Import ClubSidebarInfo

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

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours.toString().padStart(2, "0");

  return `${year}.${month}.${day}(${weekday}) ${formattedHours}:${minutes}${ampm}`;
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

function getCategoryBadgeClass(category: Enums<"meetup_category_enum">) {
  switch (category) {
    case MEETUP_CATEGORIES.STUDY:
      return "bg-blue-100 text-blue-800";
    case MEETUP_CATEGORIES.CHALLENGE:
      return "bg-purple-100 text-purple-800";
    case MEETUP_CATEGORIES.NETWORKING:
      return "bg-yellow-100 text-yellow-800";
    case MEETUP_CATEGORIES.ETC:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getLocationTypeBadgeClass(
  locationType: Enums<"meetup_location_type_enum">
) {
  switch (locationType) {
    case MEETUP_LOCATION_TYPES.ONLINE:
      return "bg-green-100 text-green-800";
    case MEETUP_LOCATION_TYPES.OFFLINE:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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
      <div className="block md:hidden mb-4">
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
      {/* 
      // More button dropdown 
      {isMember && !isOwner && (
        <div className="absolute top-0 right-0 mt-4 mr-4"> //Positioned top right
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLeaveClub}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LogOut className="mr-2 size-4" />}
                {isLoading ? "처리 중..." : "클럽 탈퇴"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )} 
      */}
      {/* Description Section */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="description">
          <AccordionTrigger
            className="text-2xl font-bold px-4 py-4"
            showDetailText={true}
          >
            <h2 className="flex items-baseline gap-1">
              💬<span className="font-extrabold pl-1">{club.name}</span>의 소개
            </h2>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm dark:prose-invert max-w-none p-6">
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
      {/* Meetups Section */}
      <div className="w-full py-8">
        <div className="flex justify-between items-center mb-4 px-4">
          <h2 className="text-2xl font-bold">
            🤝<span className="font-extrabold pl-2">모임</span>
          </h2>
          <div className="flex items-center gap-2">
            <Link href={`/socialing/club/${club.id}/meetup`}>
              <Button variant="outline" size="sm">
                모두 보기
              </Button>
            </Link>
          </div>
        </div>
        {club.meetups.length > 0 ? (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex space-x-4 px-4">
              {club.meetups.map((meetup) => (
                <div key={meetup.id} className="w-[320px] flex-shrink-0">
                  <div className="p-1 h-full">
                    <Card className="h-full transition-shadow hover:shadow-lg">
                      <CardContent className="flex flex-col items-start p-4 h-full">
                        <Link
                          href={`/socialing/meetup/${meetup.id}`}
                          className="w-full flex flex-col flex-grow"
                        >
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                              {" "}
                              {/* New row for badges */}
                              <Badge
                                className={`${getStatusBadgeClass(
                                  meetup.status
                                )} text-xs`}
                              >
                                {MEETUP_STATUS_DISPLAY_NAMES[meetup.status]}
                              </Badge>
                              <Badge
                                className={`${getCategoryBadgeClass(
                                  meetup.category
                                )} text-xs`}
                              >
                                {MEETUP_CATEGORY_DISPLAY_NAMES[meetup.category]}
                              </Badge>
                              <Badge
                                className={`${getLocationTypeBadgeClass(
                                  meetup.location_type
                                )} text-xs`}
                              >
                                {MEETUP_LOCATION_TYPE_DISPLAY_NAMES[meetup.location_type]}
                              </Badge>
                            </div>
                            <h3 className="font-semibold line-clamp-2 mb-2">
                              {meetup.title}
                            </h3>
                          </div>
                          <div className="flex flex-col text-xs text-muted-foreground space-y-1 mt-4">
                            {" "}
                            {/* Time and Location - MOVED HERE */}
                            {meetup.start_datetime && (
                              <p className="flex items-center gap-1.5">
                                <Clock className="size-3" />{" "}
                                {formatDate(meetup.start_datetime)}
                              </p>
                            )}
                            {meetup.location_description && (
                              <p className="flex items-center gap-1.5">
                                <MapPin className="size-3" />{" "}
                                {meetup.location_description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
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
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="size-3" />
                              <span>{meetup.max_participants || "무제한"}</span>
                            </div>
                          </div>
                        </Link>
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
      {/* Board Section */}
      <div className="w-full px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">
          📌<span className="font-extrabold pl-2">게시판</span>
        </h2>
        {club.forums && club.forums.length > 0 ? (
          <Tabs
            defaultValue={activeForumId}
            className="w-full"
            onValueChange={setActiveForumId}
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                {club.forums.map((forum) => (
                  <TabsTrigger key={forum.id} value={forum.id}>
                    {forum.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2">
                {canWriteForum(activeForum) && (
                  <Link
                    href={`/socialing/club/${club.id}/post/create?forum_id=${activeForumId}`}
                  >
                    <Button size="sm">새 게시글 작성</Button>
                  </Link>
                )}
              </div>
            </div>

            {club.forums.map((forum) => (
              <TabsContent key={forum.id} value={forum.id}>
                {canReadForum(forum) ? (
                  <ClubPostList posts={forum.posts} clubId={club.id} />
                ) : (
                  <div className="p-8 text-center bg-secondary rounded-lg">
                    <p className="text-secondary-foreground">
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
