import React from "react";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-md mx-auto"
        >
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-xs text-gray-500 justify-center hover:no-underline py-0">
              사업자정보
            </AccordionTrigger>
            <AccordionContent className="text-xs text-gray-500 pt-2">
              <p>BEEM | 안재현 | 859-68-00509</p>
              <p>whatsyourbeem@gmail.com | 0504-0816-1298</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </footer>
  );
}
