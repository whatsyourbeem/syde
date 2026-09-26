"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BioEditor from "@/components/user/bio-editor";
import { UserJoinedMeetupsList } from "@/components/user/user-joined-meetups-list";
import { UserBlogMiniList } from "@/components/user/user-blog-mini-list";
import { PinnedShowcasesSection } from "@/components/user/pinned-showcases-section";
import { ProfileJourneyTimeline } from "@/components/user/profile-journey-timeline";
import { SectionHeader } from "@/components/user/section-header";
import { PublicProfile } from "@/types/profile";
import { OptimizedShowcase } from "@/lib/queries/showcase-queries";

interface ProfileCardBodyProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  initialHtml?: string;
  featuredShowcases: OptimizedShowcase[];
}

export function ProfileCardBody({
  profile,
  isOwnProfile,
  initialHtml,
  featuredShowcases,
}: ProfileCardBodyProps) {
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [isViewingAllMeetups, setIsViewingAllMeetups] = useState(false);

  if (isViewingAllMeetups) {
    return (
      <div className="flex flex-col gap-0">
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
        <div className="px-5 py-8 md:px-8">
          <UserJoinedMeetupsList userId={profile.id} variant="grid" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* 스토리 */}
      <div className="px-5 py-4 md:px-8 md:py-6">
        <SectionHeader title="스토리">
          {isOwnProfile && !isEditingStory && (
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
            profileId={profile.id}
            initialBio={profile.bio}
            isOwnProfile={isOwnProfile}
            initialHtml={initialHtml}
            isEditing={isEditingStory}
            onEditingChange={setIsEditingStory}
          />
        </div>
      </div>

      {/* 대표 프로젝트 */}
      <PinnedShowcasesSection
        userId={profile.id}
        isOwnProfile={isOwnProfile}
        initialShowcases={featuredShowcases}
      />

      {/* 쓴 글 / 함께한 모임 */}
      <div className="px-5 py-4 md:px-8 md:py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserBlogMiniList userId={profile.id} />
        <div className="flex flex-col gap-2">
          <SectionHeader title="함께한 모임">
            <button
              onClick={() => setIsViewingAllMeetups(true)}
              className="flex items-center gap-0.5 text-[#777777] text-xs font-bold hover:text-sydeblue transition-colors"
            >
              전체보기
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </SectionHeader>
          <UserJoinedMeetupsList userId={profile.id} />
        </div>
      </div>

      {/* 만들어온 여정 */}
      <ProfileJourneyTimeline userId={profile.id} />
    </div>
  );
}
