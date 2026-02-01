"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
}

export function SuccessDialog({
  open,
  onOpenChange,
  mode,
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="
          flex flex-col justify-center items-center focus:outline-none overflow-hidden
          bg-white rounded-[10px]
          border-[0.91px] border-black/10
          shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]
          
          /* Mobile Styles (Default) based on CSS */
          w-[336px] h-[78px] p-[25px] gap-[16px]
          
          /* Desktop Styles (md breakpoint) */
          md:max-w-[500px] md:w-[500px] md:h-[100px] md:p-[36px]
        "
      >
        <DialogHeader className="flex flex-col justify-center items-center gap-[8px] p-0 w-full h-auto">
          <DialogTitle className="flex items-center justify-center font-pretendard font-semibold text-[18px] leading-[28px] tracking-[-0.44px] text-[#002040] whitespace-nowrap">
            {mode === "update"
              ? "🎉 SYDE 프로덕트를 수정했습니다. 🎉"
              : "🎉 SYDE 프로덕트를 등록했습니다. 🎉"}
          </DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
