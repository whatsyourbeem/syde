"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InsightDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    title?: string;
    description?: string;
}

export function InsightDeleteDialog({
    isOpen,
    onClose,
    onConfirm,
    loading = false,
    title = "잠깐! 정말 인사이트 글을 삭제하실건가요?",
    description = "삭제 후에는 되돌릴 수 없어요.",
}: InsightDeleteDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[337px] p-[25px] gap-4 rounded-[10px] border-[0.909091px] border-black/10 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
                <DialogHeader className="p-0 gap-2 items-start">
                    <DialogTitle className="text-[18px] font-semibold leading-[28px] tracking-[-0.439453px] text-[#002040] text-start">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[14px] leading-[20px] tracking-[-0.150391px] text-[#777777] text-start">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-row justify-end items-center gap-2 mt-2 p-0">
                    {/* 돌아가기 */}
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-[81.82px] h-[35.99px] p-[8px_16px] border-[0.909091px] border-black/10 rounded-[12px] bg-white text-[#002040] text-[14px] font-medium leading-[20px] hover:bg-gray-50"
                    >
                        돌아가기
                    </Button>

                    {/* 그래도 삭제할래요. */}
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-[152px] h-[35.99px] p-[8px_16px] bg-[#002040] rounded-[12px] text-white text-[14px] font-medium leading-[20px] hover:bg-[#003060]"
                    >
                        {loading ? "삭제 중..." : "⛔️ 그래도 삭제할래요."}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
