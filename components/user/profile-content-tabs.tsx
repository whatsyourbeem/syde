"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivityLogList } from "@/components/user/user-activity-log-list";
import BioEditor from "@/components/user/bio-editor";
import { LogList } from "@/components/log/log-list";
import { UserJoinedClubsList } from "@/components/user/user-joined-clubs-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logout } from "@/app/auth/auth-actions";
import { cn } from "@/lib/utils";
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
  profile: any; // Using any for now, should be replaced with a proper type
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
      <div className="w-full md:w-1/4 md:border-r md:pr-8">
        <TabsList className="flex w-full justify-center bg-muted p-1 rounded-lg space-x-2 md:flex-col md:items-stretch md:justify-start md:bg-transparent md:p-0 md:rounded-none md:space-y-1 md:space-x-0">
          <TabsTrigger
            value="bio"
            className="justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            자유 소개
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            작성한 로그
          </TabsTrigger>
          <TabsTrigger
            value="clubs"
            className="justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            가입 클럽
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="comments"
              className="justify-start md:w-full rounded-md px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
            >
              좋아요/댓글
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <div className="hidden md:block w-full">
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
      <div className="w-full md:w-3/4 md:pl-8">
        <TabsContent value="bio" className="mt-4 md:mt-0">
          <BioEditor initialBio={profile.bio} isOwnProfile={isOwnProfile} />
        </TabsContent>
        <TabsContent value="logs" className="mt-4 md:mt-0">
          <LogList currentUserId={currentUserId} filterByUserId={profile.id} />
        </TabsContent>
        <TabsContent value="clubs" className="mt-4 md:mt-0">
          <UserJoinedClubsList userId={profile.id} />
        </TabsContent>
        {isOwnProfile && (
          <TabsContent value="comments" className="mt-4 md:mt-0">
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