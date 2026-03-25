import Link from "next/link";
import Image from "next/image";
import { getActiveBanners, type Banner as BannerType } from "@/app/actions/banner-actions";
import { type BannerPosition } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BannerProps {
  position: BannerPosition;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait" | "auto";
}

export async function Banner({
  position,
  className,
  aspectRatio = "auto",
}: BannerProps) {
  const banners = await getActiveBanners(position);

  if (!banners || banners.length === 0) {
    return null;
  }

  const ratioClass = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    auto: "",
  }[aspectRatio];

  return (
    <div className={cn("w-full flex flex-col gap-y-4", className)}>
      {banners.map((banner) => (
        <div key={banner.id} className="w-full overflow-hidden rounded-lg">
          <BannerItem banner={banner} ratioClass={ratioClass} />
        </div>
      ))}
    </div>
  );
}

function BannerItem({ banner, ratioClass }: { banner: BannerType; ratioClass: string }) {
  return (
    <Link
      href={banner.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative block w-full overflow-hidden bg-muted transition-opacity hover:opacity-90",
        ratioClass
      )}
    >
      <Image
        src={banner.image_url}
        alt={banner.name}
        width={800}
        height={400}
        className="h-full w-full object-cover"
        unoptimized // Useful if using external URLs that aren't in next.config.ts
      />
    </Link>
  );
}
