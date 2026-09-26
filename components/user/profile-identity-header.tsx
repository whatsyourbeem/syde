import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";
import { CertifiedBadge } from "@/components/ui/certified-badge";
import { ShareButton } from "@/components/common/share-button";
import { ProfileUrlChip } from "@/components/user/profile-url-chip";
import { ProfileDevelopingBadge } from "@/components/user/profile-developing-badge";
import { PublicProfile } from "@/types/profile";
import { ProfileStats } from "@/lib/queries/profile-stats-queries";

interface ProfileIdentityHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  stats: ProfileStats;
}

export function ProfileIdentityHeader({
  profile,
  isOwnProfile,
  stats,
}: ProfileIdentityHeaderProps) {
  const displayName = profile.full_name || profile.username || "Anonymous";
  const avatarUrlWithCacheBuster = profile.avatar_url
    ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ""}`
    : null;

  return (
    <div className="flex flex-row items-start gap-5 px-5 py-8 md:px-8 md:py-6 border-b-[0.5px] border-[#B7B7B7]">
      <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
        {avatarUrlWithCacheBuster ? (
          <Image
            src={avatarUrlWithCacheBuster}
            alt="Avatar"
            fill
            sizes="96px"
            className="rounded-full object-cover aspect-square"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-[#D9D9D9] flex items-center justify-center text-sydeblue text-4xl font-bold">
            {displayName[0]?.toUpperCase() || "U"}
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0 flex flex-col items-start gap-2">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold leading-tight text-sydeblue">
              {displayName}
            </h1>
            {profile.certified && <CertifiedBadge size="lg" />}
            {profile.full_name && profile.username && (
              <span className="text-sm text-[#777777]">@{profile.username}</span>
            )}
          </div>

          {/* Mobile: settings icon next to name */}
          {isOwnProfile && (
            <Link
              href="/profile"
              className="md:hidden flex items-center justify-center w-8 h-8 bg-sydeblue text-[#EBF2F9] rounded-xl hover:bg-sydeblue/90 transition-colors flex-shrink-0"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>

        {profile.username && <ProfileUrlChip username={profile.username} />}

        {profile.tagline && (
          <p className="text-sm text-sydeblue">{profile.tagline}</p>
        )}

        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-[#FAFAFA] border border-[#B7B7B7] rounded-full text-[11px] font-medium text-[#777777]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {stats.activeDeveloping && (
          <ProfileDevelopingBadge showcase={stats.activeDeveloping} />
        )}

        <div className="flex items-center gap-2 pt-1">
          <ShareButton
            url={`/@${profile.username}`}
            title={displayName}
            label="프로필 공유하기"
            variant="auto"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#B7B7B7] text-sydeblue text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
          />
          {isOwnProfile && (
            <Link
              href="/profile"
              className="hidden md:inline-flex items-center gap-1 px-3 py-2 bg-sydeblue text-[#EBF2F9] text-sm font-bold rounded-xl hover:bg-sydeblue/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              프로필 편집
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
