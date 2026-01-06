"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ImagePlus, X, Box, BarChart2, ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShowcase } from "@/app/showcase/showcase-actions";

export function ProjectRegistrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  // Additional link states can be added here

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "프로젝트에 대한 자세한 설명을 적어주세요...",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 border rounded-md",
      },
    },
  });

  const handleMainImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setMainImagePreview(URL.createObjectURL(file));
      // In a real implementation, you'd handle file upload to storage here or on submit
    }
  };

  const removeMainImage = () => {
    setMainImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("content", editor?.getHTML() || "");
      // Mocking other data appending. In reality, you'd append all fields.
      // This is a placeholder for the actual server action call logic reuse
      // We might need to adjust createShowcase to accept these specific fields if it doesn't already

      // For now, simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("프로젝트가 등록되었습니다.");
      router.push("/showcase");
    } catch (error) {
      toast.error("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8 px-5 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold text-[#111827]">
          SYDE 프로덕트 등록하기
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 px-[68px] py-5">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-bold text-[#111827]">
            프로덕트 이름 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="SYDE 프로덕트 이름을 적어주세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 bg-white border-gray-200"
            required
          />
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="tagline" className="text-sm font-bold text-[#111827]">
            한 줄 소개 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="tagline"
            placeholder="SYDE 프로덕트를 한 줄로 소개해주세요."
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="h-12 bg-white border-gray-200"
            required
          />
        </div>

        {/* Main Image */}
        <div className="w-full">
          <div className="border border-gray-200 rounded-[12px] bg-white p-6 flex justify-between items-center h-[200px]">
            <div className="space-y-4 flex-1">
              <Label className="text-sm font-bold text-[#111827] block mb-2">
                대표 이미지
              </Label>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">
                  프로덕트의 얼굴!
                </p>
                <p className="text-sm text-gray-500">
                  대표 이미지를 설정해주세요.
                </p>
              </div>
              <div className="relative pt-2">
                <input
                  type="file"
                  id="main-image"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleMainImageChange}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#111827] text-white hover:bg-[#1f2937] rounded-full px-6"
                >
                  사진 선택
                </Button>
              </div>
            </div>

            {/* Image Preview Area */}
            <div className="relative w-[160px] h-[160px] bg-[#1C1F26] rounded-[16px] overflow-hidden flex items-center justify-center shrink-0 ml-4">
              {mainImagePreview ? (
                <>
                  <Image
                    src={mainImagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeMainImage}
                    className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/70 z-10"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <div className="w-full h-full relative">
                  <Image
                    src="/logo_showcase.png"
                    alt="Default Project Image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Description (TipTap) */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-[#111827]">
            프로덕트 설명
          </Label>
          <div className="border border-gray-200 rounded-[12px] bg-white min-h-[300px]">
            {/* Toolbar placeholders could go here */}
            <div className="p-4 border-b border-gray-100 text-center text-sm text-gray-400">
              TIP TAP EDITOR
            </div>
            <EditorContent editor={editor} className="p-4 min-h-[250px]" />
          </div>
        </div>

        {/* Detail Images */}
        <div className="w-full">
          <div className="border border-gray-200 rounded-[12px] bg-white p-6">
            <Label className="text-sm font-bold text-[#111827] block mb-1">
              상세 설명 이미지
            </Label>
            <p className="text-xs text-gray-500 mb-1">
              프로덕트의 스크린샷 또는 관련 설명 이미지가 있다면 추가해주세요.
              (최대 5장)
            </p>
            <p className="text-xs text-gray-400 mb-6">
              추천 사이즈 : 1600 x 900
            </p>

            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-[12px] h-[180px] mb-6 cursor-pointer border-dashed border-2 border-gray-100 hover:border-gray-200 transition-colors w-[320px] mx-auto">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm">이미지 업로드</span>
              </div>
            </div>

            {/* Thumbnail Placeholders match the design */}
            <div className="flex gap-2">
              <div className="w-12 h-12 bg-[#1C1F26] rounded-[8px] flex items-center justify-center relative">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-[8px] flex items-center justify-center">
                {/* Placeholder for chart icon */}
                <BarChart2 className="w-6 h-6 text-red-500" />
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 border border-gray-100 rounded-[8px]"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Project Links */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-[#111827]">
            프로덕트 링크 <span className="text-red-500">*</span>
          </Label>
          <div className="bg-white border border-gray-200 rounded-[12px] p-4 space-y-4">
            {/* Website Link */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <span className="text-sm font-bold">웹사이트 링크</span>
                <Plus className="ml-auto w-5 h-5 text-gray-400 cursor-pointer" />
              </div>
              <Input
                placeholder="https://www.syde.kr"
                className="bg-gray-50 border-none"
              />
              <p className="text-xs text-gray-400">예) https://www.syde.kr</p>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            {/* Google Play */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">▶️</span>
                <span className="text-sm font-bold">Google Play 링크</span>
              </div>
              <p className="text-xs text-gray-400 pl-8">
                예) https://www.syde.kr
              </p>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            {/* App Store */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍎</span>
                <span className="text-sm font-bold">App Store 링크</span>
              </div>
              <p className="text-xs text-gray-400 pl-8">
                예) https://www.syde.kr
              </p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-[#111827]">팀원 등록</Label>
          <p className="text-xs text-gray-500">
            SYDE 프로덕트를 같이 만든 팀원이 있다면 추가해주세요.
          </p>

          <div className="flex items-center gap-2 border border-gray-200 rounded-[12px] bg-white p-2">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
              DAKomm
            </span>
            <Input
              placeholder="닉네임 또는 프로필네임을 검색해보세요."
              className="border-none shadow-none focus-visible:ring-0 flex-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-full w-24 border-gray-300"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-[12px] bg-[#0F172A] hover:bg-[#1e293b]"
            disabled={isSubmitting}
          >
            등록하기
          </Button>
        </div>
      </form>
    </div>
  );
}
