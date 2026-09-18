"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        // next-themes의 테마 초기화 <script>는 SSR HTML에서만 실행된다.
        // 클라이언트 렌더에서는 데이터 블록 타입으로 표시해 React 19.3+의
        // "Encountered a script tag" 경고를 피한다.
        scriptProps={
          typeof window === "undefined" ? undefined : { type: "application/json" }
        }
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
