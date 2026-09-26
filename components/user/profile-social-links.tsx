import { Mail, Github, Twitter, Instagram, Globe } from "lucide-react";

interface ProfileSocialLinksProps {
  link: string | null;
  contactEmail: string | null;
  githubUsername: string | null;
  twitterUsername: string | null;
  instagramUsername: string | null;
}

const ICON_LINK_CLASS =
  "flex items-center justify-center w-11 h-11 rounded-full text-[#777777] hover:text-sydeblue hover:bg-[#FAFAFA] transition-colors";

/** 벨로그처럼 프로필 카드 바로 아래에 노출하는 소셜 링크 아이콘 줄. 값이 없으면 아무것도 렌더링하지 않는다. */
export function ProfileSocialLinks({
  link,
  contactEmail,
  githubUsername,
  twitterUsername,
  instagramUsername,
}: ProfileSocialLinksProps) {
  const hasSocialLinks =
    contactEmail || githubUsername || twitterUsername || instagramUsername || link;

  if (!hasSocialLinks) return null;

  return (
    <div className="flex items-center gap-1 px-5 py-2 md:px-8 -ml-2.5">
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
          aria-label="Twitter"
        >
          <Twitter className="w-6 h-6" />
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
