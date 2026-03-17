"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";


const paperlogy = localFont({
  src: [
    { path: "../../fonts/Paperlogy-7Bold.woff2", weight: "700" },
    { path: "../../fonts/Paperlogy-8ExtraBold.woff2", weight: "800" },
  ],
  display: "swap",
});



export default function Footer() {
  return (
    <>
      <footer className="hidden md:flex w-full bg-[#FAFAFA] border-t-[0.5px] border-[#B7B7B7] px-[50px] py-5 justify-between">
        <div className="w-full max-w-6xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          {/* Left Section: Logo & Copyright */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo_no_bg.png" alt="SYDE" width={28} height={28} />
              <span
                className={`text-2xl font-extrabold text-[#002040] ${paperlogy.className}`}
              >
                <span style={{ letterSpacing: "0.01em" }}>S</span>
                <span style={{ letterSpacing: "0.01em" }}>Y</span>
                <span style={{ letterSpacing: "0em" }}>DE</span>
              </span>
            </Link>
            <span className="text-[10px] text-gray-400 font-normal mt-1">
              © {new Date().getFullYear()} SYDE. All rights reserved.
            </span>
          </div>

          {/* Right Section: All Horizontal */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 lg:gap-12 w-full md:w-auto">
            {/* Main Nav Links (Hidden on Tablet, Visible on Desktop) */}
            <div className="hidden lg:flex items-center justify-center w-[253px] h-[44px] gap-[24px] font-bold text-[#002040] text-xs px-[50px] py-[10px]">
              <Link href="/about" className="hover:opacity-80">
                SYDE 소개
              </Link>
              <Link
                href="mailto:whatsyourbeem@gmail.com"
                className="hover:opacity-80"
              >
                문의하기
              </Link>
            </div>

            {/* Social Links (Vertical) */}
            <div className="flex flex-col gap-2">
              <Link
                href="https://open.kakao.com/o/gduSGmtf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#555555] hover:text-black transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Image
                    src="/kakao-talk-bw.png"
                    alt="Kakao"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="hidden xl:inline">SYDE 오픈채팅</span>
              </Link>
              <Link
                href="https://www.instagram.com/syde.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#555555] hover:text-black transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Image
                    src="/instagram.png"
                    alt="Instagram"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain opacity-70 hover:opacity-100"
                  />
                </div>
                <span className="hidden xl:inline">Instagram</span>
              </Link>
              <Link
                href="https://www.threads.com/@syde.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#555555] hover:text-black transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Image
                    src="/threads.png"
                    alt="Threads"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain opacity-70 hover:opacity-100"
                  />
                </div>
                <span className="hidden xl:inline">Threads</span>
              </Link>
            </div>

            {/* Policy & Info */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-4 text-[14px] text-[#999999]">
                <Link href="/guideline" className="hover:text-gray-600">
                  커뮤니티 가이드라인
                </Link>
                <Link
                  href="mailto:whatsyourbeem@gmail.com"
                  className="hover:text-gray-600"
                >
                  협업문의
                </Link>
                <Link href="/term" className="hover:text-gray-600">
                  이용약관
                </Link>
                <Link href="/privacy" className="hover:text-gray-600">
                  개인정보처리방침
                </Link>
              </div>


            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Footer */}
      <footer className="md:hidden w-full flex flex-col items-center py-[20px] gap-2 border-t-[0.5px] border-[#B7B7B7] bg-white">
        <div className="flex flex-row flex-wrap justify-center items-center gap-[16px] py-[5px] px-[11px] w-full">
          <Link
            href="/guideline"
            className="font-pretendard font-normal text-[14px] leading-[150%] text-[#002040] whitespace-nowrap"
          >
            커뮤니티 가이드라인
          </Link>
          <Link
            href="mailto:whatsyourbeem@gmail.com"
            className="font-pretendard font-normal text-[14px] leading-[150%] text-[#002040] whitespace-nowrap"
          >
            협업문의
          </Link>
          <Link
            href="/term"
            className="font-pretendard font-normal text-[14px] leading-[150%] text-[#002040] whitespace-nowrap"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="font-pretendard font-normal text-[14px] leading-[150%] text-[#002040] whitespace-nowrap"
          >
            개인정보처리방침
          </Link>
        </div>
        <p className="font-pretendard font-normal text-[12px] leading-[150%] text-center text-[#002040] w-full">
          © 2025 SYDE. All rights reserved.
        </p>

      </footer>
    </>
  );
}
