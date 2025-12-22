import Link from "next/link";
import Image from "next/image";

// Mock Data
const BANNERS = [
  {
    id: 1,
    title: "이미지 배너 영역",
    description: "- 별도 배너DB로, 운영자가 그때그때 홍보물 등 등록",
    imageUrl: null, // 실제 이미지가 없을 경우를 대비한 placeholder 로직 사용
    linkUrl: "#",
    bgColor: "bg-gray-100",
  },
];

export function BannerSection() {
  return (
    <div className="flex flex-col gap-4">
      {BANNERS.map((banner) => (
        <Link
          key={banner.id}
          href={banner.linkUrl}
          className={`block w-full aspect-[4/3] ${banner.bgColor} rounded-[20px] p-6 text-gray-800 hover:opacity-95 transition-opacity`}
        >
          {banner.imageUrl ? (
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              width={300}
              height={225}
              className="w-full h-full object-cover rounded-[20px]"
            />
          ) : (
            <div className="h-full flex flex-col justify-center">
              <h3 className="font-bold text-lg mb-2">{banner.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {banner.description}
              </p>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
