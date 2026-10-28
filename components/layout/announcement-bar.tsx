import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface AnnouncementBarProps {
  /** 공지 내용 */
  content: string;
  /** 클릭 시 이동할 링크. 없으면 클릭할 수 없는 안내 띠로 보인다. */
  href?: string | null;
  /** 공지 앞에 붙일 이모지. 비우면 아이콘 없이 글자만 보인다. */
  icon?: string | null;
}

const isInternalLink = (href: string) => href.startsWith("/") && !href.startsWith("//");

/**
 * 사이트 맨 위의 공지 띠 배너.
 * 스크롤하면 함께 올라가 사라지도록 고정하지 않는다(아래 내비게이션이 sticky top-0이라 위치가 겹치지 않는다).
 */
export function AnnouncementBar({ content, href, icon }: AnnouncementBarProps) {
  const inner = (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 px-5 py-2.5 text-center text-xs leading-snug md:text-sm">
      {icon?.trim() && (
        <span aria-hidden className="shrink-0 leading-none">
          {icon.trim()}
        </span>
      )}
      <span className="line-clamp-2 font-medium">{content}</span>
      {href && <ChevronRight aria-hidden className="size-3.5 shrink-0 opacity-80 md:size-4" />}
    </div>
  );

  const baseClass = "block w-full bg-sydeblue text-white";
  const linkClass = `${baseClass} transition-colors hover:bg-sydeblue/90`;

  if (!href) {
    return (
      <div role="region" aria-label="공지" className={baseClass}>
        {inner}
      </div>
    );
  }

  return isInternalLink(href) ? (
    <Link
      href={href}
      prefetch={false}
      aria-label={`공지: ${content}`}
      className={linkClass}
    >
      {inner}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`공지: ${content}`}
      className={linkClass}
    >
      {inner}
    </a>
  );
}
