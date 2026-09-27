import { Mail, Github, Instagram, Globe } from "lucide-react";
import { XLogoIcon } from "@/components/icons/x-logo-icon";
import { ShareButton } from "@/components/common/share-button";

interface ProfileSocialLinksProps {
  username: string;
  displayName: string;
  link: string | null;
  contactEmail: string | null;
  githubUsername: string | null;
  twitterUsername: string | null;
  instagramUsername: string | null;
}

const ICON_LINK_CLASS =
  "flex items-center justify-center w-11 h-11 rounded-full text-[#777777] hover:text-sydeblue hover:bg-[#FAFAFA] transition-colors";

/** 벨로그처럼 프로필 카드 바로 아래에 노출하는 소셜 링크 아이콘 줄. 프로필 공유하기도 같은 줄의 맨 앞 아이콘으로 둔다. */
export function ProfileSocialLinks({
  username,
  displayName,
  link,
  contactEmail,
  githubUsername,
  twitterUsername,
  instagramUsername,
}: ProfileSocialLinksProps) {
  return (
    <div className="flex items-center gap-1 px-5 py-2 md:px-8 -ml-2.5">
      <ShareButton
        url={`/@${username}`}
        title={displayName}
        variant="auto"
        iconSize={24}
        className={ICON_LINK_CLASS}
      />
      {contactEmail && (
        <a href={`mailto:${contactEmail}`} className={ICON_LINK_CLASS} aria-label="이메일">
          <Mail className="w-6 h-6" />
        </a>
      )}
      {githubUsername && (
        <a
          href={`https://github.com/${githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className={ICON_LINK_CLASS}
          aria-label="Github"
        >
          <Github className="w-6 h-6" />
        </a>
      )}
      {twitterUsername && (
        <a
          href={`https://x.com/${twitterUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className={ICON_LINK_CLASS}
          aria-label="X"
        >
          <XLogoIcon className="w-5 h-5" />
        </a>
      )}
      {instagramUsername && (
        <a
          href={`https://instagram.com/${instagramUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className={ICON_LINK_CLASS}
          aria-label="Instagram"
        >
          <Instagram className="w-6 h-6" />
        </a>
      )}
      {link && (
        <a
          href={link.startsWith("http") ? link : `https://${link}`}
          target="_blank"
          rel="noopener noreferrer"
          className={ICON_LINK_CLASS}
          aria-label="홈페이지"
        >
          <Globe className="w-6 h-6" />
        </a>
      )}
    </div>
  );
}
