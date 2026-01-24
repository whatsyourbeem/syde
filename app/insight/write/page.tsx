"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    Search,
    Bell,
    Menu,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function InsightWritePage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const handleSubmit = async () => {
        if (!title || !summary || !content) {
            toast.error("필수 항목을 모두 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("로그인이 필요합니다.");
                return;
            }

            const { data, error } = await supabase
                .from("insights")
                .insert([
                    {
                        user_id: user.id,
                        title,
                        summary,
                        content,
                        image_url: imageUrl || null
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            toast.success("인사이트가 등록되었습니다!");
            router.push(`/insight/${data.id}`);
        } catch (error: any) {
            console.error("Error submitting insight:", error);
            toast.error(`등록 실패: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col bg-white max-w-[393px] mx-auto font-[Pretendard]">
            {/* Page Title Section */}
            <section className="w-full flex flex-col items-center py-5 px-4 gap-4">
                <h1 className="text-[24px] font-bold leading-[29px] text-[#002040] text-center w-full">
                    SYDE 인사이트 등록하기
                </h1>
            </section>

            {/* Main Inputs Area (Based on Figma CSS) */}
            <main className="flex-grow flex flex-col p-5 gap-5 pb-10">
                {/* Title Input */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-[#002040] flex items-center gap-0.5">
                        인사이트 제목 <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full h-9 border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[#002040]">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="SYDE 인사이트 제목을 적어주세요."
                            className="w-full h-full bg-transparent px-3 text-[14px] outline-none placeholder:text-[#777777]"
                        />
                    </div>
                </div>

                {/* Tagline/Summary Input */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-[#002040] flex items-center gap-0.5">
                        한 줄 소개 <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full h-9 border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[#002040]">
                        <input
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="SYDE 인사이트를 한 줄로 표현해주세요."
                            className="w-full h-full bg-transparent px-3 text-[14px] outline-none placeholder:text-[#777777]"
                        />
                    </div>
                </div>

                {/* Representative Image UI */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-[#002040]">대표 이미지</label>
                    <div className="w-full h-[180px] border-[0.5px] border-[#B7B7B7] rounded-[10px] flex items-center justify-between p-0 overflow-hidden bg-gray-50/30">
                        {/* Left side info */}
                        <div className="flex flex-col justify-center items-center flex-1 px-4 gap-5">
                            <p className="text-[12px] leading-[14px] text-[#777777] text-center">
                                인사이트를 잘 표현하는<br />대표 이미지를 설정해주세요.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-20 h-8 bg-[#002040] hover:bg-[#003060] text-white text-[14px] rounded-[12px] font-normal"
                                    onClick={() => {
                                        const url = prompt("이미지 URL을 입력해주세요. (실제 업로드 기능은 추후 연동 가능)");
                                        if (url) setImageUrl(url);
                                    }}
                                >
                                    설정
                                </Button>
                                {imageUrl && (
                                    <button
                                        onClick={() => setImageUrl("")}
                                        className="text-[10px] text-red-400 hover:underline"
                                    >
                                        이미지 삭제
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right side preview (Component 2 in Figma) */}
                        <div className="w-[180px] h-full bg-[#222E35] flex items-center justify-center relative">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="relative text-white flex flex-col items-center transform scale-75">
                                    <span className="text-[10px] absolute -top-4 -left-6 rotate-[-15deg] font-bold opacity-70">SYDE!</span>
                                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center rotate-[-5deg] shadow-lg">
                                        <div className="w-16 h-16 bg-[#222E35] rounded-full flex flex-col items-center justify-center relative">
                                            <div className="flex gap-4 mt-2">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                            <div className="w-8 h-4 border-b-2 border-white rounded-full mt-1"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Plus icon overlay for add feel */}
                            {!imageUrl && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Plus className="w-10 h-10 text-white/20" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area (Tiptap placeholder) */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-[14px] font-medium text-[#002040]">내용 <span className="text-red-500">*</span></label>
                    <div className="w-full min-h-[400px] border-[0.5px] border-[#B7B7B7] rounded-[10px] relative transition-all focus-within:ring-1 focus-within:ring-[#002040]">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="TIP TAP EDITOR"
                            className="w-full h-full min-h-[398px] bg-transparent p-4 text-[16px] outline-none placeholder:text-[#002040]/30 resize-none font-medium"
                        />
                    </div>
                </div>

                {/* Buttons Section */}
                <div className="flex flex-row gap-2.5 w-full mt-2">
                    <Button
                        variant="outline"
                        className="w-[53px] h-9 border-[#002040] text-[#002040] rounded-[12px] text-[14px] hover:bg-gray-50"
                        onClick={() => router.back()}
                    >
                        취소
                    </Button>
                    <Button
                        className="flex-grow h-9 bg-[#002040] hover:bg-[#003060] text-white rounded-[12px] text-[14px] font-medium"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "등록 중..." : "인사이트 등록하기"}
                    </Button>
                </div>
            </main>
        </div>
    );
}
