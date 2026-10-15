"use client";

import { useState } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import { QRCodeSVG } from "qrcode.react";
import { Github, Globe, IdCard, Instagram, Mail } from "lucide-react";
import { XLogoIcon } from "@/components/icons/x-logo-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { PublicProfile } from "@/types/profile";

type ContactIcon = React.ComponentType<{ className?: string }>;

interface BusinessCardDialogProps {
  profile: PublicProfile;
  className?: string;
}

// 헤더·푸터의 SYDE 워드마크와 같은 Paperlogy ExtraBold.
const paperlogy = localFont({
  src: [{ path: "../../fonts/Paperlogy-8ExtraBold.woff2", weight: "800" }],
});

const FACE_CLASS =
  "absolute inset-0 rounded-2xl overflow-hidden shadow-2xl [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

// 종이 질감: feTurbulence 노이즈를 배경색 위에 얹는다. 흰 종이는 어두운 결, 파란 종이는 밝은 결.
const paperNoise = (rgb: "0 0 0" | "255 255 255") => {
  const [r, g, b] = rgb.split(" ").map((v) => Number(v) / 255);
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'>" +
    "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/>" +
    `<feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0.9 -0.25'/></filter>` +
    "<rect width='100%' height='100%' filter='url(%23n)'/></svg>";
  return `url("data:image/svg+xml;utf8,${svg}")`;
};

function PaperTexture({ tone }: { tone: "dark" | "light" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 pointer-events-none",
        tone === "dark" ? "opacity-[0.18]" : "opacity-[0.16]"
      )}
      style={{
        backgroundImage: paperNoise(tone === "dark" ? "0 0 0" : "255 255 255"),
        backgroundSize: "260px 260px",
      }}
    />
  );
}

/** SYDE 큐브 로고 + 워드마크. 흰 종이(front)에서는 네이비, 파란 종이(back)에서는 흰색. */
function SydeLogo({
  onPaper,
  stacked,
  className,
}: {
  onPaper: boolean;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center",
        stacked ? "flex-col gap-0" : "gap-1",
        className
      )}
    >
      {/* logo_no_bg.png는 여백이 있어(큐브가 칸의 약 67%) 여백 없는 logo_white.png는 같은 비율로 줄여 앞뒷면의 시각적 크기를 맞춘다. */}
      <span
        className={cn(
          "flex items-center justify-center",
          stacked ? "w-16 h-16 md:w-20 md:h-20" : "w-9 h-9 md:w-10 md:h-10"
        )}
      >
        <Image
          src={onPaper ? "/logo_no_bg.png" : "/logo_white.png"}
          alt=""
          width={96}
          height={96}
          className={cn("object-contain", onPaper ? "w-full h-full" : "w-[70%] h-[70%]")}
        />
      </span>
      <span
        className={cn(
          "font-extrabold leading-none",
          stacked ? "text-xl md:text-2xl" : "text-2xl md:text-[28px]",
          onPaper ? "text-sydeblue" : "text-white",
          paperlogy.className
        )}
      >
        <span style={{ letterSpacing: "0.01em" }}>S</span>
        <span style={{ letterSpacing: "0.01em" }}>Y</span>
        <span style={{ letterSpacing: "0em" }}>DE</span>
      </span>
    </div>
  );
}

/**
 * 앞면(흰 종이). 애플 명함처럼 로고는 한쪽에 크게 두고,
 * 이름·직함은 위, 연락처는 아래로 나눠 담는다.
 * 모바일(세로): 로고 위 / 정보 아래. 데스크탑(가로): 로고 왼쪽 / 정보 오른쪽.
 */
function CardFront({ profile }: { profile: PublicProfile }) {
  const displayName = profile.full_name || profile.username || "Anonymous";
  const tags = (profile.tags ?? []).slice(0, 3);
  // 우선순위: 이메일 > 인스타그램 > 웹사이트, 비어 있으면 GitHub > X 순으로 채워 최대 3개를 보여준다.
  // 아이콘은 프로필 페이지의 소셜 아이콘과 동일하다.
  const candidates: { Icon: ContactIcon; value?: string | null }[] = [
    { Icon: Mail, value: profile.contact_email },
    { Icon: Instagram, value: profile.instagram_username },
    {
      Icon: Globe,
      value: profile.link?.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    },
    { Icon: Github, value: profile.github_username },
    {
      Icon: XLogoIcon,
      value: profile.twitter_username && `@${profile.twitter_username}`,
    },
  ];
  const contacts = candidates.filter(
    (c): c is { Icon: ContactIcon; value: string } => !!c.value
  );

  return (
    <div
      className={cn(
        FACE_CLASS,
        "bg-[#FBFAF7] text-sydeblue border border-black/5",
        "flex flex-col md:flex-row p-6 md:p-8"
      )}
    >
      <PaperTexture tone="dark" />

      <div className="relative flex-1 flex items-center justify-center md:pr-6">
        <SydeLogo onPaper stacked />
      </div>

      <div className="relative flex flex-col gap-4 min-w-0 md:flex-1 md:justify-between md:pl-2">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-semibold leading-tight truncate">
            {displayName}
          </h2>
          {profile.tagline && (
            <p className="mt-1.5 text-[11px] leading-[1.3] text-[#777777] line-clamp-2">
              {profile.tagline}
            </p>
          )}
          {tags.length > 0 && (
            <p className="mt-1 text-[11px] text-[#999999] truncate">
              {tags.map((t) => `#${t}`).join(" ")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-0.5 text-xs text-[#777777] min-w-0">
          <p className="truncate font-medium text-sydeblue mb-1">syde.kr/@{profile.username}</p>
          {contacts.slice(0, 3).map((c) => (
            <p key={c.value} className="flex items-center gap-1.5 min-w-0 text-[11px]">
              <c.Icon className="w-3 h-3 shrink-0 text-[#999999]" />
              <span className="truncate">{c.value}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 뒷면(sydeblue 종이). 로고와 프로필 QR코드. */
function CardBack({ profile }: { profile: PublicProfile }) {
  const profileUrl = `${SITE_URL}/@${profile.username}`;

  return (
    <div
      className={cn(
        FACE_CLASS,
        "bg-sydeblue text-white [transform:rotateY(180deg)]",
        "flex flex-col md:flex-row items-center justify-center gap-5 md:gap-12 p-6"
      )}
    >
      <PaperTexture tone="light" />
      <SydeLogo onPaper={false} stacked className="relative" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="bg-white rounded-xl p-3">
          <QRCodeSVG
            value={profileUrl}
            size={132}
            level="M"
            fgColor="#002040"
            bgColor="#ffffff"
            title={`${profile.full_name || profile.username}님의 SYDE 프로필`}
          />
        </div>
        <p className="text-xs text-white/70 text-center">
          QR코드를 스캔하면 프로필로 이동해요
        </p>
      </div>
    </div>
  );
}

/** 프로필 명함 버튼 + 다이얼로그. 명함을 탭하면 앞/뒷면이 3D로 뒤집힌다. */
export function BusinessCardDialog({
  profile,
  className,
}: BusinessCardDialogProps) {
  const [flipped, setFlipped] = useState(false);

  if (!profile.username) return null;

  return (
    <Dialog onOpenChange={(open) => open && setFlipped(false)}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="명함 보기"
          className={cn(
            "flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#B7B7B7] text-[13px] font-medium text-sydeblue hover:bg-[#FAFAFA] transition-colors",
            className
          )}
        >
          <IdCard className="w-4 h-4" />
          명함
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-auto max-w-none sm:max-w-none border-0 bg-transparent p-0 shadow-none overflow-visible"
      >
        <DialogTitle className="sr-only">
          {profile.full_name || profile.username}님의 명함
        </DialogTitle>
        <DialogDescription className="sr-only">
          명함을 누르면 앞면과 뒷면이 뒤집어집니다. 뒷면의 QR코드로 프로필에
          접속할 수 있어요.
        </DialogDescription>
        <div className="[perspective:1200px]">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-label={flipped ? "명함 앞면 보기" : "명함 뒷면 보기"}
            className={cn(
              // 모바일: 세로 명함(55:91), 데스크탑: 가로 명함(91:55)
              "relative block w-[min(260px,80vw)] aspect-[55/91] md:w-[455px] md:aspect-[91/55]",
              "text-left rounded-2xl outline-none transition-transform duration-700 ease-in-out [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]"
            )}
          >
            <CardFront profile={profile} />
            <CardBack profile={profile} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
