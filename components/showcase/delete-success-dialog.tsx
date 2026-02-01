"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";

interface DeleteSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function DeleteSuccessDialog({
  open,
  onOpenChange,
  onClose,
}: DeleteSuccessDialogProps) {
  // Auto-close or handle redirect logic typically handled by parent,
  // but if this component is purely visual, we just render it.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="
          flex flex-col justify-center items-center focus:outline-none overflow-hidden
          bg-white rounded-[10px]
          border-[0.91px] border-black/10
          shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]
          
          /* Mobile Styles (Responsive) */
          w-[321px] p-[25px] h-auto
          
          /* Desktop Styles (md breakpoint) - based on provided CSS */
          md:w-[500px] md:h-[100px] md:p-[36px] md:max-w-[500px]
        "
      >
        <DialogHeader className="flex flex-col justify-center items-center p-0 w-full h-auto space-y-0">
          <DialogTitle className="flex items-center justify-center font-pretendard font-semibold text-[18px] leading-[28px] tracking-[-0.44px] text-[#002040] text-center w-full">
            SYDE 프로덕트를 삭제했습니다.
          </DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
