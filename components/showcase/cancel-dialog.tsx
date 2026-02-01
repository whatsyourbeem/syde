"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CancelDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="
          flex flex-col items-start focus:outline-none overflow-hidden
          bg-white rounded-[10px]
          border-[0.91px] border-black/10
          shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]
          
          /* Mobile Styles (Default) based on CSS */
          w-[321px] h-auto p-[25px] gap-[16px]
          
          /* Desktop Styles (md breakpoint) */
          md:max-w-[500px] md:w-[500px] md:h-auto md:p-[36px]
        "
      >
        <DialogHeader className="flex flex-col items-start gap-[8px] p-0 w-full h-auto">
          <DialogTitle className="flex items-center font-pretendard font-semibold text-[18px] leading-[28px] tracking-[-0.44px] text-[#002040] whitespace-pre-wrap text-left">
            잠깐! 지금까지 쓴 내용이 지워져요 😢{"\n"}그래도 나가시겠어요?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-row justify-end items-start gap-[8px] w-full mt-auto">
          <button
            onClick={onCancel}
            className="
              box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[8px] 
              bg-white border-[0.91px] border-black/10 rounded-[12px] 
              font-pretendard font-medium text-[14px] leading-[20px] tracking-[-0.15px] text-[#002040] hover:bg-gray-50 whitespace-nowrap
              h-[36px]
              
              /* Responsive Width adjustment */
              w-[132px] md:w-[139px]
            "
          >
            💪 계속 작성할래요
          </button>
          <button
            onClick={onConfirm}
            className="
              flex flex-row justify-center items-center px-[16px] py-[8px] gap-[8px] 
              bg-[#002040] rounded-[12px] 
              font-pretendard font-medium text-[14px] leading-[20px] tracking-[-0.15px] text-white hover:bg-[#002040]/90 whitespace-nowrap
              h-[36px]
              
              /* Responsive Width adjustment */
              w-[92px] md:w-[98px]
            "
          >
            🏃 나갈래요
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
