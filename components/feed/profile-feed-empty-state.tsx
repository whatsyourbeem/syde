"use client";

import { FeedEditDialog } from "@/components/feed/feed-edit-dialog";
import { Button } from "@/components/ui/button";
import { Tables } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";

interface ProfileFeedEmptyStateProps {
  isOwnProfile: boolean;
  profile: PublicProfile;
}

export function ProfileFeedEmptyState({
  isOwnProfile,
  profile,
}: ProfileFeedEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#FAFAFA] rounded-xl w-full max-w-[600px] mx-auto">
      <div className="flex flex-col items-center gap-2 mb-6 text-[#777777] text-base leading-[150%] text-center font-medium">
        <p>아직 남긴 피드가 없어요.</p>
        <p>곧 새로운 이야기가 시작될지도 몰라요. 🧚‍♀️</p>
      </div>

      {isOwnProfile && (
        <FeedEditDialog
          userId={profile.id}
          avatarUrl={profile.avatar_url}
          username={profile.username}
          full_name={profile.full_name}
        >
          <Button
            className="bg-sydeorange hover:bg-sydeorange/90 text-white rounded-xl px-4 py-2 h-9 font-medium text-sm transition-colors"
          >
            ✍️ 피드 작성하기
          </Button>
        </FeedEditDialog>
      )}
    </div>
  );
}
