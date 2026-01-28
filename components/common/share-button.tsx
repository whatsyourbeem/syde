"use client";

import React, { useState, useCallback } from "react";
import { Share2, Link2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShareButtonProps {
    url: string;
    title?: string;
    className?: string;
    iconSize?: number;
}

export function ShareButton({ url, title = "SYDE", className = "", iconSize = 18 }: ShareButtonProps) {
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [copyUrl, setCopyUrl] = useState("");

    const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(fullUrl);
                toast.success("링크를 복사했어요!");
            } catch {
                setCopyUrl(fullUrl);
                setShowCopyDialog(true);
            }
        } else {
            setCopyUrl(fullUrl);
            setShowCopyDialog(true);
        }
    }, [url]);

    const handleShareAll = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
        const text = `Check out this ${title} on SYDE!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: fullUrl,
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error("Error sharing:", error);
                }
            }
        } else {
            toast.info("이 브라우저에서는 공유 기능을 지원하지 않습니다.");
        }
    }, [url, title]);

    return (
        <>
            <TooltipProvider>
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    className={`flex items-center gap-1 rounded-md p-2 -m-2 bg-transparent hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-blue-900/20 ${className}`}
                                >
                                    <Share2 size={iconSize} />
                                </button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>공유</p>
                        </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                            <Link2 className="mr-2 h-4 w-4" />
                            <span>링크 복사하기</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleShareAll} className="cursor-pointer">
                            <span>모두 보기</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TooltipProvider>

            <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
                <AlertDialogContent className="w-[350px] rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>링크 복사</AlertDialogTitle>
                        <AlertDialogDescription>
                            자동 복사를 지원하지 않는 환경입니다. 수동으로 복사해주세요.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2 flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={copyUrl}
                            className="w-full p-2 border rounded bg-muted text-muted-foreground flex-grow"
                            onFocus={(e) => e.target.select()}
                        />
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (navigator.clipboard && window.isSecureContext) {
                                    try {
                                        await navigator.clipboard.writeText(copyUrl);
                                        toast.success("링크를 복사했어요!");
                                    } catch {
                                        toast.error("복사에 실패했어요. 수동으로 복사해주세요.");
                                    }
                                } else {
                                    toast.error("브라우저에서 클립보드 복사를 지원하지 않아요.");
                                }
                            }}
                            className="p-2 rounded-md hover:bg-secondary"
                            aria-label="Copy link"
                        >
                            <Copy size={18} />
                        </button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={(e) => {
                            e.stopPropagation();
                            setShowCopyDialog(false);
                        }}>
                            닫기
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
