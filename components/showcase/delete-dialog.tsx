"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="
          flex flex-col items-start focus:outline-none overflow-hidden
          bg-white rounded-[10px]
          border-[0.91px] border-black/10
          shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]
          
          /* Mobile Styles (Default) */
          w-[321px] h-auto p-[25px] gap-[16px]
          
          /* Desktop Styles (md breakpoint) - based on provided CSS */
          md:max-w-[500px] md:w-[500px] md:h-auto md:p-[36px]
        "
      >
        <AlertDialogHeader className="flex flex-col items-start gap-[8px] p-0 w-full h-auto">
          <AlertDialogTitle className="flex items-center font-pretendard font-semibold text-[18px] leading-[28px] tracking-[-0.44px] text-[#002040] whitespace-pre-wrap text-left">
            잠깐! 정말 내 SYDE를 삭제하실건가요?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-inter font-normal text-[14px] leading-[20px] tracking-[-0.15px] text-[#777777] text-left">
            삭제 후에는 되돌릴 수 없어요.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-row justify-end items-start gap-[8px] w-full mt-auto">
          <AlertDialogCancel
            className="
              box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[8px] 
              bg-white border-[0.91px] border-black/10 rounded-[12px] 
              font-pretendard font-medium text-[14px] leading-[20px] tracking-[-0.15px] text-[#002040] hover:bg-gray-50 whitespace-nowrap
              h-[36px] mt-0
              
              /* Button Widths (Responsive) */
              w-[82px] md:w-[82px] 
            "
          >
            돌아가기
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="
              flex flex-row justify-center items-center px-[16px] py-[8px] gap-[8px] 
              bg-[#002040] rounded-[12px] 
              font-pretendard font-medium text-[14px] leading-[20px] tracking-[-0.15px] text-white hover:bg-[#002040]/90 whitespace-nowrap
              h-[36px]
              
              /* Button Widths (Responsive) */
              w-[152px] md:w-[152px]
            "
          >
            ⛔️ 그래도 삭제할래요.
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
