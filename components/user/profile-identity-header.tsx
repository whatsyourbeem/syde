import Image from "next/image";
import { CertifiedBadge } from "@/components/ui/certified-badge";
import { PublicProfile } from "@/types/profile";

interface ProfileIdentityHeaderProps {
  profile: PublicProfile;
}

export function ProfileIdentityHeader({
  profile,
}: ProfileIdentityHeaderProps) {
  const displayName = profile.full_name || profile.username || "Anonymous";
  const avatarUrlWithCacheBuster = profile.avatar_url
    ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ""}`
    : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-5 px-5 py-8 md:px-8 md:py-6">
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

      <div className="flex-grow min-w-0 flex flex-col items-center md:items-start gap-2 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2.5">
          <span className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold leading-tight text-sydeblue">
              {displayName}
            </h1>
            {profile.certified && <CertifiedBadge size="lg" />}
          </span>
          {profile.full_name && profile.username && (
            <span className="text-sm text-[#777777]">@{profile.username}</span>
          )}
        </div>

        {profile.tagline && (
          <p className="text-sm text-sydeblue">{profile.tagline}</p>
        )}

        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-[#FAFAFA] border border-[#B7B7B7] rounded-full text-[11px] font-medium text-[#777777]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
