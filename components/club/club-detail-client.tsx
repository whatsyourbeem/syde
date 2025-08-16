"use client";

import { useState } from "react";
import { Tables, Enums } from "@/types/database.types";
import TiptapViewer from "@/components/common/tiptap-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, MapPin, Users, UserPlus, LogOut, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { joinClub, leaveClub } from "@/app/gathering/club/actions";
import ClubPostList from "./club-post-list"; // Import ClubPostList

// Type Definitions
type Profile = Tables<'profiles'>;
type Meetup = Tables<'meetups'> & { organizer_profile: Profile | null };
type ClubMember = Tables<'club_members'> & { profiles: Profile | null };
type ClubForum = Tables<'club_forums'>;
type ClubForumPost = Tables<'club_forum_posts'> & { author: Profile | null };

type Club = Tables<'clubs'> & {
  owner_profile: Profile | null;
  members: ClubMember[];
  meetups: Meetup[];
  forum: ClubForum | null;
  posts: ClubForumPost[];
};

interface ClubDetailClientProps {
  club: Club;
  isMember: boolean;
  currentUserId?: string;
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
export default function ClubDetailClient({ club, isMember, currentUserId }: ClubDetailClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinClub = async () => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await joinClub(club.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("클럽에 가입되었습니다.");
      }
    } catch (error) {
      console.error(error);
      toast.error("클럽 가입 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="w-full p-4">
      {/* Header Section */}
      <header className="mb-8">
        <div className="relative h-48 w-full rounded-lg overflow-hidden mb-4">
          <Image
            src={club.thumbnail_url || "/default_thumbnail.png"}
            alt={`${club.name} thumbnail`}
            layout="fill"
            objectFit="cover"
            className="bg-muted"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="size-6">
                <AvatarImage src={club.owner_profile?.avatar_url || undefined} />
                <AvatarFallback>{club.owner_profile?.username?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span>
                <span className="font-semibold text-primary">{club.owner_profile?.full_name || club.owner_profile?.username}</span>
                <span className="ml-1">클럽장</span>
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            {isOwner ? (
              <div className="flex items-center gap-2">
                <Button disabled>클럽장입니다</Button>
                <Link href={`/gathering/meetup/create?club_id=${club.id}`}>
                  <Button>모임 만들기</Button>
                </Link>
              </div>
            ) : isMember ? (
              <Button variant="outline" onClick={handleLeaveClub} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LogOut className="mr-2 size-4" />}
                {isLoading ? "처리 중..." : "클럽 탈퇴"}
              </Button>
            ) : (
              <Button onClick={handleJoinClub} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
                {isLoading ? "처리 중..." : "클럽 가입"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Description Section */}
      <section className="prose prose-sm dark:prose-invert max-w-none mb-8 p-6 bg-muted rounded-lg">
        {club.description ? (
          <TiptapViewer content={club.description} />
        ) : (
          <p className="text-muted-foreground">클럽 설명이 아직 없습니다.</p>
        )}
      </section>

      {/* Tabs Section */}
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="board">게시판</TabsTrigger>
          <TabsTrigger value="meetups">모임 ({club.meetups.length})</TabsTrigger>
          <TabsTrigger value="members">멤버 ({club.members.length})</TabsTrigger>
        </TabsList>

        {/* Board Tab */}
        <TabsContent value="board" className="mt-4">
          {club.forum ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">{club.forum.name}</h2>
              <div className="mb-6 flex justify-end">
                {isMember ? (
                  <Link href={`/gathering/club/${club.id}/post/create`}>
                    <Button>새 게시글 작성</Button>
                  </Link>
                ) : (
                  <div className="p-4 border rounded-lg text-center text-muted-foreground">
                    <p>클럽에 가입해야 게시글을 작성할 수 있습니다.</p>
                  </div>
                )}
              </div>
              {/* Replace existing post rendering with ClubPostList */}
              <ClubPostList posts={club.posts} clubId={club.id} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>이 클럽에는 아직 게시판이 없습니다.</p>
            </div>
          )}
        </TabsContent>

        {/* Meetups Tab */}
        <TabsContent value="meetups" className="mt-4">
          {club.meetups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {club.meetups.map((meetup) => (
                <Link href={`/gathering/meetup/${meetup.id}`} key={meetup.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow h-full flex flex-col">
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>이 클럽에서 주최하는 모임이 아직 없습니다.</p>
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
           {club.members.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {club.members.map((member) => (
                <Link href={`/${member.profiles?.username}`} key={member.profiles?.id} className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:shadow-md transition-shadow">
                  <Avatar className="size-16">
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">{member.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-semibold text-sm truncate">{member.profiles?.full_name || member.profiles?.username}</p>
                    <p className="text-xs text-muted-foreground">@{member.profiles?.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-12 text-muted-foreground">
              <p>클럽 멤버가 아직 없습니다.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
