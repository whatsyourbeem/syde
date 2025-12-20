"use client";

import Image from "next/image";
import { ShowcaseEditDialog } from "@/components/showcase/showcase-edit-dialog";
import { Database } from "@/types/database.types";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { Button } from "@/components/ui/button";

interface ShowcaseBannerProps {
  user: Database["public"]["Tables"]["profiles"]["Row"] | null;
  avatarUrl: string | null;
}

export function ShowcaseBanner({ user, avatarUrl }: ShowcaseBannerProps) {
  const { openLoginDialog } = useLoginDialog();

  const handleStartClick = () => {
    if (!user) {
      openLoginDialog();
    }
  };

  const bannerContent = (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100 min-h-[300px] md:min-h-[240px] flex flex-col justify-center px-6 md:px-10 py-8">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/showcase/showcase-intro-bg.png"
          alt="Showcase Banner Background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Fallback overlay in case image fails or for text text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-transparent md:from-white/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
          Showcase
        </h1>
        <p className="text-base md:text-lg text-gray-700 font-semibold leading-relaxed whitespace-pre-wrap">
          작은 시작도, 완벽하지 않아도,
          <br />
          모두 여기서 함께 빛날 수 있어요.
        </p>

        <div className="pt-2">
          {user ? (
            <ShowcaseEditDialog
              userId={user.id}
              avatarUrl={avatarUrl}
              username={user.username}
              full_name={user.full_name}
            >
              <Button className="bg-[#ED6D34] hover:bg-[#d95d28] text-white font-bold px-8 py-6 rounded-lg text-lg transition-transform hover:scale-105">
                쇼케이스 시작하기
              </Button>
            </ShowcaseEditDialog>
          ) : (
            <Button
              onClick={openLoginDialog}
              className="bg-[#ED6D34] hover:bg-[#d95d28] text-white font-bold px-8 py-6 rounded-lg text-lg transition-transform hover:scale-105"
            >
              쇼케이스 시작하기
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return <div className="w-full">{bannerContent}</div>;
}
