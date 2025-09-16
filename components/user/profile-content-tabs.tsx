"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivityLogList } from "@/components/user/user-activity-log-list";
import BioEditor from "@/components/user/bio-editor";
import { LogList } from "@/components/log/log-list";
import { UserJoinedClubsList } from "@/components/user/user-joined-clubs-list";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/auth-actions";
import { cn } from "@/lib/utils";
import { Tables } from "@/types/database.types";
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



interface ProfileContentTabsProps {
  isOwnProfile: boolean;
  profile: Tables<"profiles">;
  currentUserId: string | null;
  className?: string;
}

export function ProfileContentTabs({
  isOwnProfile,
  profile,
  currentUserId,
  className,
}: ProfileContentTabsProps) {
  return (
    <Tabs
      defaultValue="bio"
      className={cn("w-full md:flex-row md:gap-8 h-full", className)}
    >
      {/* Left Sidebar */}
      <div className="w-full md:w-1/4 md:border-r border-b md:border-b-0 md:pr-8 pt-4">
        <TabsList className="flex w-full justify-center p-1 rounded-lg space-x-2 md:flex-col md:items-stretch md:justify-start bg-transparent md:p-0 md:rounded-none md:space-y-1 md:space-x-0">
          <TabsTrigger
            value="bio"
            className="md:justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-secondary hover:text-secondary-foreground data-[state=active]:bg-secondary data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            자유 소개
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="md:justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-secondary hover:text-secondary-foreground data-[state=active]:bg-secondary data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            작성한 로그
          </TabsTrigger>
          <TabsTrigger
            value="clubs"
            className="md:justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-secondary hover:text-secondary-foreground data-[state=active]:bg-secondary data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            가입 클럽
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="activity"
              className="md:justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-secondary hover:text-secondary-foreground data-[state=active]:bg-secondary data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
            >
              나의 활동
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <div className="hidden md:block w-full pt-8">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-md px-3 py-1.5 text-sm font-normal"
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
      <div className="w-full md:w-3/4 px-4 md:pl-0 pt-2">
        <TabsContent value="bio" className="mt-2 md:mt-0">
          <BioEditor initialBio={profile.bio} isOwnProfile={isOwnProfile} />
        </TabsContent>
        <TabsContent value="logs" className="mt-2 md:mt-0">
          <LogList currentUserId={currentUserId} filterByUserId={profile.id} />
        </TabsContent>
        <TabsContent value="clubs" className="md:mt-0">
          <UserJoinedClubsList userId={profile.id} />
        </TabsContent>
        {isOwnProfile && (
          <TabsContent value="activity" className="mt-2 md:mt-0">
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