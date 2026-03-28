"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivityLogList } from "@/components/user/user-activity-log-list";
import BioEditor from "@/components/user/bio-editor";
import { LogList } from "@/components/log/log-list";
import { ShowcaseList } from "@/components/showcase/showcase-list";
import { InsightList } from "@/components/insight/insight-list";
import { UserJoinedClubsList } from "@/components/user/user-joined-clubs-list";
import { UserShowcaseList } from "@/components/user/user-showcase-list";
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

const MAIN_TAB_TRIGGER_CLASS = 
  "flex-1 md:flex-none justify-center md:justify-start h-full md:h-auto rounded-none md:rounded-xl px-4 py-3 md:px-3 md:py-1 text-base md:text-sm text-[#777777] bg-white md:bg-[#FAFAFA] hover:bg-[#F1F1F1] data-[state=active]:bg-white md:data-[state=active]:bg-[#FAFAFA] data-[state=active]:text-sydeblue data-[state=active]:font-bold data-[state=active]:shadow-none border-0 border-b-4 border-transparent data-[state=active]:border-sydeblue md:border-b-0";

const SUB_TAB_CLASS = 
  "flex items-center justify-center px-3 py-1.5 rounded-xl transition-all whitespace-nowrap";

// Sub-components for cleaner JSX
const SectionHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <span className="text-sydeorange font-bold">—</span>
      <span className="font-bold text-base text-black">{title}</span>
    </div>
    {children}
  </div>
);

const SubTabButton = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      SUB_TAB_CLASS,
      isActive 
        ? "bg-[rgba(237,109,52,0.1)] text-sydeorange font-bold text-[15px]" 
        : "bg-[#FAFAFA] text-[#777777] font-medium text-[14px]"
    )}
  >
    {label}
  </button>
);

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
  const [activeSubTab, setActiveSubTab] = useState<"log" | "showcase" | "insight">("log");

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
      {/* Sidebar/Top Tab Bar Container */}
      <div className={cn(
        "w-full md:w-[240px] md:min-w-[240px] md:border-r-[0.5px] border-[#B7B7B7] flex flex-col",
        isEditingStory && "hidden md:flex"
      )}>
        <TabsList className="flex items-center justify-start w-full bg-transparent p-0 h-[43px] md:h-auto border-b-[0.5px] md:border-b-0 border-[#B7B7B7] md:flex-col md:items-stretch md:justify-start md:py-5 md:px-2.5 md:gap-2.5 rounded-none">
          <TabsTrigger value="profile" className={MAIN_TAB_TRIGGER_CLASS}>
            프로필
          </TabsTrigger>
          <TabsTrigger value="posts" className={MAIN_TAB_TRIGGER_CLASS}>
            게시글
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="activity" className={MAIN_TAB_TRIGGER_CLASS}>
              내 기록 🔒
            </TabsTrigger>
          )}

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
        </TabsList>
      </div>

      {/* Right Content */}
      <div className="w-full md:flex-1 overflow-y-auto">
        {/* 프로필 Tab: Bio + Clubs + Meetups */}
        <TabsContent value="profile" className="mt-0">
          <div className="flex flex-col gap-0">
            {isEditingStory ? (
              /* Story Edit Header */
              <div className="flex items-center gap-4 px-5 py-4 md:px-8 md:py-6 border-b-[0.5px] border-[#B7B7B7]">
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
              <div className="flex items-center gap-4 px-5 py-4 md:px-8 md:py-6 border-b-[0.5px] border-[#B7B7B7]">
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
            ) : null}

            {/* 메인 콘텐츠 영역 */}
            <div className="w-full">
              {isViewingAllMeetups ? (
                /* Full Meetups Grid */
                <div className="px-5 py-8 md:px-8">
                  <UserJoinedMeetupsList userId={profile.id} variant="grid" />
                </div>
              ) : isEditingStory ? (
                /* 스토리 Editor (Edit Mode) */
                <div className="px-5 py-8 md:px-8">
                  <BioEditor
                    initialBio={profile.bio}
                    isOwnProfile={isOwnProfile}
                    initialHtml={initialHtml}
                    link={profile.link}
                    isEditing={isEditingStory}
                    onEditingChange={setIsEditingStory}
                  />
                </div>
              ) : (
                /* Standard Profile View (Story + Clubs + Meetups) */
                <>
                  {/* 스토리 Section */}
                  <div className="px-5 py-4 md:px-8 md:py-6">
                    <SectionHeader title="스토리">
                      {isOwnProfile && (
                        <button 
                          onClick={() => setIsEditingStory(true)}
                          className="text-sydeorange text-[13px] font-bold hover:opacity-80 transition-opacity"
                        >
                          스토리 수정 ✍️
                        </button>
                      )}
                    </SectionHeader>
                    <div className="rounded-xl relative bg-[#FAFAFA] p-5">
                      <BioEditor
                        initialBio={profile.bio}
                        isOwnProfile={isOwnProfile}
                        initialHtml={initialHtml}
                        link={profile.link}
                        isEditing={isEditingStory}
                        onEditingChange={setIsEditingStory}
                      />
                    </div>
                  </div>

                  {/* 쇼케이스 Section */}
                  <div className="px-5 py-4 md:px-8 md:py-6">
                    <SectionHeader title="쇼케이스" />
                    <div className="bg-[#FAFAFA] rounded-xl p-2.5">
                      <UserShowcaseList 
                        userId={profile.id} 
                        variant="compact" 
                        currentUserId={currentUserId}
                      />
                    </div>
                  </div>

                  {/* 함께하는 모임 Section (Horizontal Scroll) */}
                  <div className="px-5 py-4 md:px-8 md:py-6">
                    <SectionHeader title="함께하는 모임">
                      <button 
                        onClick={() => setIsViewingAllMeetups(true)}
                        className="flex items-center gap-0.5 text-[#777777] text-xs font-bold hover:text-sydeblue transition-colors"
                      >
                        모두보기
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </SectionHeader>
                    <UserJoinedMeetupsList userId={profile.id} />
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 내 게시글 Tab (with Sub-tabs) */}
        <TabsContent value="posts" className="mt-0 p-0 flex flex-col">
          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-start w-full bg-white px-6 py-3 gap-[10px] border-b-[0.5px] border-[#B7B7B7] overflow-x-auto no-scrollbar">
            <SubTabButton label="로그" isActive={activeSubTab === "log"} onClick={() => setActiveSubTab("log")} />
            <SubTabButton label="쇼케이스" isActive={activeSubTab === "showcase"} onClick={() => setActiveSubTab("showcase")} />
            <SubTabButton label="인사이트" isActive={activeSubTab === "insight"} onClick={() => setActiveSubTab("insight")} />
          </div>

          {/* Sub-tab Content with standardized padding */}
          <div className="flex-1 px-5 py-4 md:px-8 md:py-6">
            {activeSubTab === "log" && (
              <LogList 
                currentUserId={currentUserId} 
                filterByUserId={profile.id} 
                emptyState={<ProfileLogEmptyState isOwnProfile={isOwnProfile} profile={profile} />}
              />
            )}
            {activeSubTab === "showcase" && (
              <ShowcaseList 
                currentUserId={currentUserId}
                filterByParticipantUserId={profile.id}
              />
            )}
            {activeSubTab === "insight" && (
              <InsightList 
                currentUserId={currentUserId}
                userId={profile.id}
                showInteractions={false}
              />
            )}
          </div>
        </TabsContent>

        {/* 내 기록 Tab */}
        {isOwnProfile && (
          <TabsContent value="activity" className="mt-0 px-5 py-4 md:px-8 md:py-6">
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
