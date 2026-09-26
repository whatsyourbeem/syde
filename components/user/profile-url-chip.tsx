"use client";

import { useCallback } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface ProfileUrlChipProps {
  username: string;
  className?: string;
}

export function ProfileUrlChip({ username, className }: ProfileUrlChipProps) {
  const path = `/@${username}`;

  const handleCopy = useCallback(async () => {
    const fullUrl = `${window.location.origin}${path}`;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast.success("링크를 복사했어요!");
        return;
      } catch {
        // fall through
      }
    }
    toast.error("복사에 실패했어요. 직접 복사해주세요.");
  }, [path]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAFAFA] border border-[#B7B7B7] rounded-full text-[11px] font-medium text-[#777777] hover:bg-[#F1F1F1] transition-colors ${className || ""}`}
    >
      <span className="font-mono">syde.kr{path}</span>
      <Copy className="w-3 h-3" />
    </button>
  );
}
