import React from "react";

export function ShowcaseHeader() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-8 gap-4 border-b-[0.5px] border-[#B7B7B7]">
      <h1 className="font-pretendard font-bold text-[24px] text-[#002040]">
        Showcase
      </h1>
      <p className="font-pretendard font-normal text-[14px] text-[#777777] text-center w-full break-keep px-4">
        작은 시작도, 완벽하지 않아도, 모두 여기서 함께 빛날 수 있어요.
      </p>
    </div>
  );
}
