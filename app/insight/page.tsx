"use client";

import Image from "next/image";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface InsightCardProps {
    title: string;
    description: string;
    author: {
        name: string;
        role: string;
        avatarUrl?: string;
    };
    stats: {
        likes: number;
        comments: number;
        bookmarks: number;
    };
}

function InsightCard({ title, description, author, stats }: InsightCardProps) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-6">
            {/* Thumbnail Area */}
            <div className="aspect-[4/3] bg-[#222E35] flex items-center justify-center relative overflow-hidden">
                <div className="flex flex-col items-center">
                    {/* Mocking the SYDE logo/character from screenshot */}
                    <div className="relative text-white flex flex-col items-center">
                        <span className="text-[10px] absolute -top-4 -left-6 rotate-[-15deg] font-bold opacity-70">SYDE!</span>
                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center rotate-[-5deg]">
                            <div className="w-16 h-16 bg-[#222E35] rounded-full flex flex-col items-center justify-center relative">
                                <div className="flex gap-4 mt-2">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="w-8 h-4 border-b-2 border-white rounded-full mt-1"></div>
                            </div>
                        </div>
                        <p className="mt-4 text-xl font-bold tracking-tight">we're SYDERS !</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                    {title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                    {description}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-2 mb-4">
                    <Avatar className="w-6 h-6">
                        <AvatarImage src={author.avatarUrl} />
                        <AvatarFallback>{author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-800">{author.name}</span>
                        <span className="text-xs text-gray-400">| {author.role}</span>
                    </div>
                </div>

                {/* Interaction Bar */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Heart className="w-5 h-5" />
                            <span className="text-xs font-medium">{stats.likes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-xs font-medium">{stats.comments}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="flex items-center gap-1.5 text-[#F5C518] font-bold">
                            <Bookmark className="w-5 h-5 fill-current" />
                            <span className="text-xs">{stats.bookmarks}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InsightPage() {
    const dummyInsights: InsightCardProps[] = [
        {
            title: "일이삼사오육칠팔구십일이삼사ㄴㅇㄹㄴㅇㄹ..",
            description: "이 프로덕트는 이렇고 저렇고 그렇습니다...",
            author: {
                name: "제이현",
                role: "사이드프로젝터 | 제너럴리스트",
                avatarUrl: "https://github.com/shadcn.png",
            },
            stats: {
                likes: 1,
                comments: 3,
                bookmarks: 2,
            },
        },
        {
            title: "일이삼사오육칠팔구십일이삼사ㄴㅇㄹㄴㅇㄹ..",
            description: "이 프로덕트는 이렇고 저렇고 그렇습니다...",
            author: {
                name: "제이현",
                role: "사이드프로젝터 | 제너럴리스트",
                avatarUrl: "https://github.com/shadcn.png",
            },
            stats: {
                likes: 1,
                comments: 3,
                bookmarks: 2,
            },
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 py-10 mb-6 text-center">
                <h1 className="text-3xl font-extrabold text-[#112D4E] mb-2 tracking-tight">
                    Insights
                </h1>
                <p className="text-sm text-gray-400 font-medium">
                    사이드 프로젝트를 더 오래, 더 잘 하기 위한 이야기들.
                </p>
            </div>

            {/* Content */}
            <div className="max-w-md mx-auto px-4">
                {dummyInsights.map((insight, index) => (
                    <InsightCard key={index} {...insight} />
                ))}
            </div>
        </div>
    );
}
