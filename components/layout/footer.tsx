import React from "react";
import Link from "next/link";
import Image from "next/image";
import localFont from "next/font/local";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const paperlogy = localFont({
  src: [
    { path: "../../fonts/Paperlogy-7Bold.ttf", weight: "700" },
    { path: "../../fonts/Paperlogy-8ExtraBold.ttf", weight: "800" },
  ],
  display: "swap",
});

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-6">
      <div className="w-full max-w-6xl mx-auto px-5 flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0">
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
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 w-full lg:w-auto">
          {/* Main Nav Links */}
          <div className="flex gap-6 font-bold text-[#002040] text-xs">
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
            <div className="flex items-center gap-4 text-[10px] text-[#999999]">
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

            <Accordion type="single" collapsible className="border-none w-auto">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="text-[10px] text-[#999999] py-0 hover:no-underline gap-1justify-end [&>svg]:w-3 [&>svg]:h-3 h-4">
                  사업자정보
                </AccordionTrigger>
                <AccordionContent className="absolute right-0 mt-1 p-3 bg-white border border-gray-100 rounded shadow-sm min-w-[200px] z-10 text-[10px] text-[#999999]">
                  <p>BEEM | 대표: 안재현</p>
                  <p>사업자등록번호: 859-68-00509</p>
                  <p>이메일: whatsyourbeem@gmail.com</p>
                  <p>전화번호: 0504-0816-1298</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </footer>
  );
}
