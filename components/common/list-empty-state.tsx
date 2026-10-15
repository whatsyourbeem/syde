import type { ReactNode } from "react";

/**
 * 목록이 비었을 때 보여주는 안내 문구.
 * 목록 화면마다 간격·색이 달라 보이지 않도록 한 곳에서 정한다. 위쪽 정렬이며 가로로만 가운데에 놓는다.
 */
export function ListEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-20 text-center text-gray-500">
      <p>{children}</p>
    </div>
  );
}
