import { Link2 } from "lucide-react";

interface ProfileFooterProps {
  displayName: string;
  link: string | null;
}

export function ProfileFooter({ displayName, link }: ProfileFooterProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-6 md:px-8 border-t-[0.5px] border-[#B7B7B7]">
      <p className="text-[11px] text-[#B7B7B7]">
        이 페이지는 {displayName}님의 SYDE 명함입니다.
      </p>
      {link && (
        <a
          href={link.startsWith("http") ? link : `https://${link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#B7B7B7] rounded-full text-[11px] font-bold text-sydeblue hover:bg-gray-50 transition-colors self-start md:self-auto"
        >
          <Link2 className="w-3 h-3" />
          {link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
        </a>
      )}
    </div>
  );
}
