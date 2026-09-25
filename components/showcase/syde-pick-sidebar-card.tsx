import Link from "next/link";
import Image from "next/image";
import { fetchLatestAwardedShowcase } from "@/app/showcase/showcase-data-actions";

export async function SydePickSidebarCard() {
  const showcase = await fetchLatestAwardedShowcase();

  if (!showcase) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-lg">
      <Link
        href={`/showcase/${showcase.slug || showcase.id}`}
        prefetch={false}
        className="relative block w-full aspect-[2/1] overflow-hidden bg-[#0F172A] transition-opacity hover:opacity-90"
      >
        {showcase.thumbnail_url && (
          <Image
            src={showcase.thumbnail_url}
            alt={showcase.name}
            fill
            sizes="20vw"
            className="object-cover opacity-50"
            unoptimized
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-between px-4 py-2 text-white">
          <span className="font-['Paperlogy'] font-extrabold text-[11px] tracking-tight">
            이 주의 SYDE Pick
          </span>
          <div>
            <p className="font-bold text-base truncate">{showcase.name}</p>
            {showcase.short_description && (
              <p className="text-[11px] text-white/80 truncate">{showcase.short_description}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
