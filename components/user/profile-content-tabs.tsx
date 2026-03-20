"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivityLogList } from "@/components/user/user-activity-log-list";
import BioEditor from "@/components/user/bio-editor";
import { LogList } from "@/components/log/log-list";
import { UserJoinedClubsList } from "@/components/user/user-joined-clubs-list";
import { UserJoinedMeetupsList } from "@/components/user/user-joined-meetups-list";
import { ProfileLogEmptyState } from "@/components/log/profile-log-empty-state";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/auth-actions";
import { cn } from "@/lib/utils";
import { Tables } from "@/types/database.types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";

interface ProfileContentTabsProps {
  isOwnProfile: boolean;
  profile: Tables<"profiles">;
  currentUserId: string | null;
  initialHtml?: string;
  className?: string;
}

const tabTriggerClass =
  "w-full justify-start rounded-xl px-3 py-1 text-sm text-[#777777] bg-[#FAFAFA] hover:bg-[#F1F1F1] data-[state=active]:bg-[#FAFAFA] data-[state=active]:text-sydeblue data-[state=active]:font-bold data-[state=active]:shadow-none";

export function ProfileContentTabs({
  isOwnProfile,
  profile,
  currentUserId,
  initialHtml,
  className,
}: ProfileContentTabsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [isViewingAllMeetups, setIsViewingAllMeetups] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Tabs
      defaultValue="profile"
      className={cn("w-full md:flex md:flex-row h-full", className)}
    >
      {/* Left Sidebar */}
      <div className={cn(
        "w-full md:w-[240px] md:min-w-[240px] md:border-r-[0.5px] border-b-[0.5px] md:border-b-0 border-[#B7B7B7] py-5 px-2.5 flex flex-col",
        isEditingStory && "hidden md:flex"
      )}>
        <div className="flex flex-row md:flex-col gap-2.5 px-5 justify-center md:justify-start">
          <TabsList className="flex w-full justify-center md:flex-col md:items-stretch md:justify-start bg-transparent p-0 space-x-2 md:space-x-0 md:space-y-2.5 h-auto">
            <TabsTrigger value="profile" className={tabTriggerClass}>
              프로필
            </TabsTrigger>
            <TabsTrigger value="posts" className={tabTriggerClass}>
              게시글
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="activity" className={tabTriggerClass}>
                🔒 내 기록
              </TabsTrigger>
            )}
          </TabsList>

          {/* Logout (stacked under tabs, desktop only) */}
          {isOwnProfile && (
            <div className="hidden md:block pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl px-3 py-1 text-sm text-[#777777] font-normal bg-[#FAFAFA] hover:bg-[#F1F1F1]"
                  >
                    로그아웃
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <form action={logout}>
                      <AlertDialogAction asChild>
                        <Button type="submit">로그아웃</Button>
                      </AlertDialogAction>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className="w-full md:flex-1 overflow-y-auto">
        {/* 프로필 Tab: Bio + Clubs + Meetups */}
        <TabsContent value="profile" className="mt-0">
          <div className="flex flex-col gap-0">
            {isEditingStory ? (
              /* Story Edit Header */
              <div className="flex items-center gap-4 px-8 py-6 border-b-[0.5px] border-[#B7B7B7]">
                <button 
                  onClick={() => setIsEditingStory(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-sydeblue" />
                </button>
                <h2 className="text-xl font-bold text-sydeblue">
                  {profile.full_name || profile.username}님의 스토리
                </h2>
              </div>
            ) : isViewingAllMeetups ? (
              /* Meetups Full View Header */
              <div className="flex items-center gap-4 px-8 py-6 border-b-[0.5px] border-[#B7B7B7]">
                <button 
                  onClick={() => setIsViewingAllMeetups(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-sydeblue" />
                </button>
                <h2 className="text-xl font-bold text-sydeblue">
                  {profile.full_name || profile.username}님과 함께하는 모임 🌱
                </h2>
              </div>
            ) : (
              /* 스토리 Section Header (Standard Unified View) */
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500 font-bold">—</span>
                  <span className="font-bold text-base text-black">스토리</span>
                </div>
              </div>
            )}

            {/* 메인 콘텐츠 영역 (스토리 / 모임 그리드) */}
            <div className={cn(
              "px-5 pb-8",
              (isEditingStory || isViewingAllMeetups) ? "pt-8" : "pt-0"
            )}>
              {isViewingAllMeetups ? (
                /* Full Meetups Grid */
                <UserJoinedMeetupsList userId={profile.id} variant="grid" />
              ) : (
                /* 스토리 Editor/Viewer (Standard or Edit Mode) */
                <div className={cn(
                  "rounded-xl relative",
                  isEditingStory ? "" : "bg-[#FAFAFA] p-5"
                )}>
                  <BioEditor
                    initialBio={profile.bio}
                    isOwnProfile={isOwnProfile}
                    initialHtml={initialHtml}
                    link={profile.link}
                    isEditing={isEditingStory}
                    onEditingChange={setIsEditingStory}
                  />
                </div>
              )}
            </div>

            {/* Other Sections - Only visible when in standard unified view */}
            {!isEditingStory && !isViewingAllMeetups && (
              <>
                {/* 소속된 클럽 Section */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 font-bold">—</span>
                    <span className="font-bold text-base text-black">소속된 클럽</span>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-xl p-2.5">
                    <UserJoinedClubsList userId={profile.id} variant="compact" />
                  </div>
                </div>

                {/* 함께하는 모임 Section (Horizontal Scroll) */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">—</span>
                      <span className="font-bold text-base text-black">함께하는 모임</span>
                    </div>
                    <button 
                      onClick={() => setIsViewingAllMeetups(true)}
                      className="flex items-center gap-0.5 text-[#777777] text-xs font-bold hover:text-sydeblue transition-colors"
                    >
                      모두보기
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <UserJoinedMeetupsList userId={profile.id} />
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* 내 게시글 Tab */}
        <TabsContent value="posts" className="mt-0 px-5 py-4">
          <LogList 
            currentUserId={currentUserId} 
            filterByUserId={profile.id} 
            emptyState={<ProfileLogEmptyState isOwnProfile={isOwnProfile} profile={profile} />}
          />
        </TabsContent>

        {/* 내 기록 Tab */}
        {isOwnProfile && (
          <TabsContent value="activity" className="mt-0 px-5 py-4">
            <UserActivityLogList
              currentUserId={currentUserId}
              userId={profile.id}
            />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}

