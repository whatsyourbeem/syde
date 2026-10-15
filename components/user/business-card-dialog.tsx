"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import localFont from "next/font/local";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, Github, Globe, IdCard, Instagram, Mail } from "lucide-react";
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

// 3D 뒤집기용 면(겹쳐 놓고 뒷면을 숨김)과, 이미지 저장용 평면(그냥 나란히 놓는 면).
// 화면에 보이는 카드는 모서리가 둥글고, 저장하는 이미지(flat)는 각진 모서리다.
const FACE_3D =
  "absolute inset-0 rounded-2xl shadow-2xl [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";
const FACE_FLAT = "relative w-full h-full";
const FACE_BASE = "overflow-hidden";

// 모바일: 세로 명함(55:91), 데스크탑: 가로 명함(91:55)
const CARD_SIZE_CLASS =
  "w-[min(260px,80vw)] aspect-[55/91] md:w-[455px] md:aspect-[91/55]";

// 종이 질감: 미리 구워 둔 노이즈 PNG(검은 결, 투명 배경)를 배경색 위에 얹는다.
// 파란 종이는 같은 파일을 invert로 흰 결로 뒤집어 쓴다.
// (CSS 배경 SVG의 feTurbulence 필터는 html-to-image 캡처에서 적용되지 않아 일반 이미지로 둔다.)
function PaperTexture({ tone }: { tone: "dark" | "light" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 pointer-events-none",
        tone === "dark" ? "opacity-[0.18]" : "opacity-[0.16] invert"
      )}
      style={{
        backgroundImage: "url(/paper-noise.png)",
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
function CardFront({ profile, flat }: { profile: PublicProfile; flat?: boolean }) {
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
        FACE_BASE,
        flat ? FACE_FLAT : FACE_3D,
        "bg-[#FBFAF7] text-sydeblue",
        !flat && "border border-black/5",
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
function CardBack({ profile, flat }: { profile: PublicProfile; flat?: boolean }) {
  const profileUrl = `${SITE_URL}/@${profile.username}`;

  return (
    <div
      className={cn(
        FACE_BASE,
        flat ? FACE_FLAT : cn(FACE_3D, "[transform:rotateY(180deg)]"),
        "bg-sydeblue text-white",
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

/**
 * 이미지 저장용 화면 밖 영역. 3D 변환이 걸린 실제 카드 대신 같은 면을 평면으로 하나씩 놓고,
 * 지금 보고 있는 면의 노드만 골라 캡처한다.
 * 화면 밖으로 밀어내는 위치 지정은 바깥 래퍼가 맡고, 캡처 대상(ref)에는 위치 스타일을 두지 않는다.
 * (복제된 노드에 left:-9999px가 남으면 결과 이미지가 비어 버린다.)
 * 다이얼로그가 열렸을 때만 렌더되므로 document를 써도 서버 렌더링과 충돌하지 않는다.
 */
function CaptureSurface({
  profile,
  frontRef,
  backRef,
}: {
  profile: PublicProfile;
  frontRef: React.RefObject<HTMLDivElement | null>;
  backRef: React.RefObject<HTMLDivElement | null>;
}) {
  return createPortal(
    <div aria-hidden className="fixed left-[-9999px] top-0 flex gap-6 pointer-events-none">
      <div ref={frontRef} className={CARD_SIZE_CLASS}>
        <CardFront profile={profile} flat />
      </div>
      <div ref={backRef} className={CARD_SIZE_CLASS}>
        <CardBack profile={profile} flat />
      </div>
    </div>,
    document.body
  );
}

/** 프로필 명함 버튼 + 다이얼로그. 명함을 탭하면 앞/뒷면이 3D로 뒤집힌다. */
export function BusinessCardDialog({
  profile,
  className,
}: BusinessCardDialogProps) {
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  // 이미지 저장용: 3D 변환이 걸린 실제 카드 대신, 같은 면을 평면으로 놓은 화면 밖 영역을 캡처한다.
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  if (!profile.username) return null;

  const handleSave = async () => {
    // 지금 보이는 면만 저장한다.
    const side = flipped ? "back" : "front";
    const node = (flipped ? backRef : frontRef).current;
    if (!node || saving) return;
    setSaving(true);
    try {
      const options = { pixelRatio: 3, cacheBust: true };
      // 첫 호출에서는 폰트·이미지가 덜 반영돼 비어 보이는 브라우저(Safari)가 있어 한 번 예열한다.
      await toPng(node, options);
      const dataUrl = await toPng(node, options);
      const fileName = `syde-card-${profile.username}-${side}.png`;
      const file = new File([await (await fetch(dataUrl)).blob()], fileName, {
        type: "image/png",
      });

      // 모바일은 공유 시트("이미지 저장" 포함), 데스크탑은 바로 다운로드한다.
      if (
        window.matchMedia("(pointer: coarse)").matches &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({ files: [file] });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        link.click();
        toast.success("명함 이미지를 저장했어요!");
      }
    } catch (error) {
      // 공유 시트를 그냥 닫은 경우는 실패가 아니다.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("이미지를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

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
              "relative block",
              CARD_SIZE_CLASS,
              "text-left rounded-2xl outline-none transition-transform duration-700 ease-in-out [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]"
            )}
          >
            <CardFront profile={profile} />
            <CardBack profile={profile} />
          </button>
        </div>

        <div className="mt-3 flex justify-center">
          {/* 배경 없는 텍스트 버튼. 밑줄은 안쪽 요소에 둬서 아이콘과 글자 아래로 지나가고, 터치 영역은 p-2로 넓힌다. */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="p-2 text-white hover:opacity-80 disabled:opacity-60 transition-opacity"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold border-b border-white pb-0.5">
              <Download className="w-4 h-4" />
              {saving ? "저장 중..." : "이미지로 저장하기"}
            </span>
          </button>
        </div>

        <CaptureSurface profile={profile} frontRef={frontRef} backRef={backRef} />
      </DialogContent>
    </Dialog>
  );
}
