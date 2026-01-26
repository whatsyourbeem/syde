import React from "react";

export function ShowcaseHeader() {
  return (
    <div className="w-full border-b border-[#B7B7B7]/50 bg-white">
      <div className="max-w-[1440px] mx-auto h-[120px] flex flex-col justify-center items-center px-4 py-8 gap-4 box-border">
        <div className="flex flex-col justify-center items-center gap-[10px] w-full">
          <h1 className="w-auto h-[29px] font-pretendard font-bold text-[24px] leading-[29px] flex items-center text-[#002040]">
            Showcase
          </h1>
          <p className="w-full max-w-[345px] h-[17px] font-pretendard font-normal text-[14px] leading-[17px] flex items-center justify-center text-center text-[#777777]">
            작은 시작도, 완벽하지 않아도, 모두 여기서 함께 빛날 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
