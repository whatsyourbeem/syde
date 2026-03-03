import React from "react";

import Link from "next/link";


export default function Footer() {
  return (
    <footer className="bg-white text-black py-6 mt-auto text-xs border-t border-gray-200">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4 flex justify-center space-x-4 text-xs">
          <Link href="/guideline" className="hover:underline">
            커뮤니티가이드라인
          </Link>
          <Link
            href="mailto:whatsyourbeem@gmail.com"
            className="hover:underline"
          >
            협업문의
          </Link>
          <Link href="/term" className="hover:underline">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:underline">
            개인정보처리방침
          </Link>
        </div>
        <p className="mb-1">
          &copy; {new Date().getFullYear()} SYDE. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
