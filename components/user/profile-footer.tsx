import { Mail, Github, Twitter, Instagram, Globe } from "lucide-react";

interface ProfileFooterProps {
  displayName: string;
  link: string | null;
  contactEmail: string | null;
  githubUsername: string | null;
  twitterUsername: string | null;
  instagramUsername: string | null;
}

const ICON_LINK_CLASS =
  "flex items-center justify-center w-8 h-8 rounded-full text-[#777777] hover:text-sydeblue hover:bg-[#FAFAFA] transition-colors";

export function ProfileFooter({
  displayName,
  link,
  contactEmail,
  githubUsername,
  twitterUsername,
  instagramUsername,
}: ProfileFooterProps) {
  const hasSocialLinks =
    contactEmail || githubUsername || twitterUsername || instagramUsername || link;

  return (
    <div className="flex flex-col gap-3 px-5 py-6 md:px-8 border-t-[0.5px] border-[#B7B7B7]">
      {hasSocialLinks && (
        <div className="flex items-center gap-1 -ml-1.5">
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className={ICON_LINK_CLASS} aria-label="이메일">
              <Mail className="w-4 h-4" />
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
              <Github className="w-4 h-4" />
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
              <Twitter className="w-4 h-4" />
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
              <Instagram className="w-4 h-4" />
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
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
      <p className="text-[11px] text-[#B7B7B7]">
        이 페이지는 {displayName}님의 SYDE 명함입니다.
      </p>
    </div>
  );
}
