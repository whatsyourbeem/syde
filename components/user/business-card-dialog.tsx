"use client";

import { useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { IdCard } from "lucide-react";
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

interface BusinessCardDialogProps {
  profile: PublicProfile;
  className?: string;
}

const FACE_CLASS =
  "absolute inset-0 rounded-2xl bg-sydeblue text-white shadow-2xl overflow-hidden [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

function SydeLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Image
        src="/logo_no_bg_light.png"
        alt=""
        width={64}
        height={64}
        className="w-9 h-9 md:w-10 md:h-10 brightness-0 invert"
      />
      <span className="text-lg md:text-xl font-bold tracking-[0.2em]">SYDE</span>
    </div>
  );
}

function CardFront({ profile }: { profile: PublicProfile }) {
  const displayName = profile.full_name || profile.username || "Anonymous";
  const tags = (profile.tags ?? []).slice(0, 3);
  const contacts = [
    profile.contact_email && { label: "E", value: profile.contact_email },
    profile.link && {
      label: "W",
      value: profile.link.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    },
    profile.github_username && { label: "G", value: profile.github_username },
    profile.instagram_username && {
      label: "I",
      value: `@${profile.instagram_username}`,
    },
  ].filter((c): c is { label: string; value: string } => !!c);

  return (
    <div
      className={cn(
        FACE_CLASS,
        "flex flex-col justify-between p-6 md:p-8"
      )}
    >
      <SydeLogo />

      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-end gap-2 min-w-0">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight truncate">
            {displayName}
          </h2>
        </div>
        {profile.username && (
          <p className="text-sm text-white/70">@{profile.username}</p>
        )}
        {profile.tagline && (
          <p className="text-sm md:text-[15px] text-white/90 line-clamp-2 mt-1">
            {profile.tagline}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full border border-white/30 text-[11px] text-white/80"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-xs text-white/70 min-w-0">
        {contacts.slice(0, 3).map((c) => (
          <p key={c.label} className="truncate">
            <span className="inline-block w-4 font-semibold text-sydeorange">
              {c.label}
            </span>
            {c.value}
          </p>
        ))}
        {contacts.length === 0 && (
          <p className="truncate">syde.kr/@{profile.username}</p>
        )}
      </div>
    </div>
  );
}

function CardBack({ profile }: { profile: PublicProfile }) {
  const profileUrl = `${SITE_URL}/@${profile.username}`;

  return (
    <div
      className={cn(
        FACE_CLASS,
        "[transform:rotateY(180deg)] flex flex-col items-center justify-center gap-4 p-6"
      )}
    >
      <SydeLogo />
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
