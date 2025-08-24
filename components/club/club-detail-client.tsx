"use client";

import { useState } from "react";
import { Tables, Enums } from "@/types/database.types";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, MapPin, Users, LogOut, Loader2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { leaveClub } from "@/app/socialing/club/actions";
import ClubPostList from "./club-post-list"; // Import ClubPostList
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ClubSidebarInfo from "./club-sidebar-info"; // Import ClubSidebarInfo

// Type Definitions
type Profile = Tables<'profiles'>;
type Meetup = Tables<'meetups'> & { organizer_profile: Profile | null };
type ClubMember = Tables<'club_members'> & { profiles: Profile | null };

type ClubForumPost = Tables<'club_forum_posts'> & { author: Profile | null };

type ForumWithPosts = Tables<'club_forums'> & { posts: ClubForumPost[] };

type Club = Tables<'clubs'> & {
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
}

// Helper Functions for Meetup Card
function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

function getStatusBadgeClass(status: Enums<"meetup_status_enum">) {
  switch (status) {
    case "오픈예정": return "border-gray-400 bg-gray-100 text-gray-700";
    case "신청가능": return "border-green-500 bg-green-50 text-green-700";
    case "신청마감": return "border-red-500 bg-red-50 text-red-700";
    case "종료": return "border-gray-500 bg-gray-50 text-gray-700";
    default: return "border-gray-500 bg-gray-50 text-gray-700";
  }
}

// Main Component
export default function ClubDetailClient({ club, isMember, currentUserId, userRole }: ClubDetailClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeForumId, setActiveForumId] = useState(club.forums[0]?.id || "");

  const handleLeaveClub = async () => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await leaveClub(club.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("클럽에서 탈퇴했습니다.");
      }
    } catch (error) {
      console.error(error);
      toast.error("클럽 탈퇴 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = currentUserId === club.owner_id;

  const canReadForum = (forum: ForumWithPosts) => {
    const permission = forum.read_permission;
    if (permission === 'PUBLIC') {
      return true;
    }
    if (permission === 'MEMBER') {
      return isMember;
    }
    if (permission === 'FULL_MEMBER') {
      return userRole === 'FULL_MEMBER' || userRole === 'LEADER';
    }
    if (permission === 'LEADER') {
      return userRole === 'LEADER';
    }
    return false;
  };

  const canWriteForum = (forum: ForumWithPosts | undefined) => {
    if (!forum || !isMember) return false;
    const permission = forum.write_permission;
    if (permission === 'MEMBER') {
      return true;
    }
    if (permission === 'FULL_MEMBER') {
      return userRole === 'FULL_MEMBER' || userRole === 'LEADER';
    }
    if (permission === 'LEADER') {
      return userRole === 'LEADER';
    }
    return false;
  };

  const activeForum = club.forums.find((f) => f.id === activeForumId);

  return (
    <div className="relative"> {/* Added relative positioning */}
      <div className="block md:hidden mb-4"> {/* Visible only on mobile */}
        <ClubSidebarInfo
          clubName={club.name}
          clubTagline={club.tagline || undefined}
          clubId={club.id}
          clubThumbnailUrl={club.thumbnail_url || undefined}
          ownerProfile={club.owner_profile}
          isMember={isMember}
          currentUserId={currentUserId}
          userRole={userRole}
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
          <AccordionTrigger className="text-2xl font-bold px-4 py-4" showDetailText={true}>
            <h2 className="flex items-baseline gap-1">💬<span className="font-extrabold pl-1">{club.name}</span>의 소개</h2>
          </AccordionTrigger>
          <AccordionContent className="prose prose-sm dark:prose-invert max-w-none p-6">
            {club.description ? (
              <TiptapViewer content={club.description} />
            ) : (
              <p className="text-muted-foreground">클럽 설명이 아직 없습니다.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Meetups Section */}
      <div className="w-full px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">🤝<span className="font-extrabold pl-2">모임</span></h2>
        {club.meetups.length > 0 ? (
          <div className="px-12"> {/* New wrapper div with padding */}
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {club.meetups.map((meetup) => (
                  <CarouselItem key={meetup.id} className="md:basis-1/2 lg:basis-1/3 ">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex flex-col items-start p-4">
                          <Link href={`/socialing/meetup/${meetup.id}`} className="w-full">
                            <div className="flex-grow">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold line-clamp-2">{meetup.title}</h3>
                                <Badge className={getStatusBadgeClass(meetup.status)}>{meetup.status}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                {meetup.start_datetime && (
                                  <p className="flex items-center gap-1.5"><Clock className="size-3" /> {formatDate(meetup.start_datetime)}</p>
                                )}
                                {meetup.location_description && (
                                  <p className="flex items-center gap-1.5"><MapPin className="size-3" /> {formatDate(meetup.location_description)}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <Avatar className="size-5">
                                  <AvatarImage src={meetup.organizer_profile?.avatar_url || undefined} />
                                  <AvatarFallback>{meetup.organizer_profile?.username?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{meetup.organizer_profile?.full_name || meetup.organizer_profile?.username}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="size-3" />
                                <span>{meetup.max_participants || '무제한'}</span>
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>이 클럽에서 주최하는 모임이 아직 없습니다.</p>
          </div>
        )}
      </div>

      {/* Board Section */}
      <div className="w-full px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">📌<span className="font-extrabold pl-2">게시판</span></h2>
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
                {isOwner && (
                   <Link href={`/socialing/club/${club.id}/manage`}>
                      <Button variant="outline" size="sm">게시판 관리</Button>
                   </Link>
                )}
                {canWriteForum(activeForum) && (
                  <Link href={`/socialing/club/${club.id}/post/create?forum_id=${activeForumId}`}>
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
            {isOwner && (
               <Link href={`/socialing/club/${club.id}/manage`}>
                  <Button className="mt-4">게시판 관리하기</Button>
                </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
