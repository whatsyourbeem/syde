"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ImagePlus, X, ChevronLeft, Plus, Globe } from "lucide-react";
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
          <Label htmlFor="title" className="text-sm font-medium text-[#002040]">
            프로덕트 이름 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="SYDE 프로덕트 이름을 적어주세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-[36px] bg-white border-[#B7B7B7] rounded-[10px] text-sm placeholder:text-[#777777]"
            required
          />
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label
            htmlFor="tagline"
            className="text-sm font-medium text-[#002040]"
          >
            한 줄 소개 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="tagline"
            placeholder="SYDE 프로덕트를 한 줄로 소개해주세요."
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="h-[36px] bg-white border-[#B7B7B7] rounded-[10px] text-sm placeholder:text-[#777777]"
            required
          />
        </div>

        {/* Main Image */}
        <div className="w-full">
          <div className="border border-[#B7B7B7] rounded-[12px] bg-white p-6 flex justify-between items-center h-[200px]">
            <div className="space-y-4 flex-1">
              <Label className="text-sm font-medium text-[#002040] block mb-2">
                대표 이미지
              </Label>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#002040]">
                  프로덕트의 얼굴!
                </p>
                <p className="text-sm text-[#777777]">
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
                  className="bg-[#002040] text-white hover:bg-[#002040]/90 rounded-full px-6"
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
        <div className="w-full">
          <div className="border border-[#B7B7B7] rounded-[12px] bg-white h-[237px] flex flex-col">
            <div className="p-6 pb-2">
              <Label className="text-sm font-medium text-[#002040]">
                프로덕트 설명
              </Label>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {/* Toolbar placeholders could go here */}
              <div className="px-4 py-3 border-y border-[#F1F1F1] text-center text-sm text-[#777777] bg-gray-50/50">
                TIP TAP EDITOR
              </div>
              <EditorContent
                editor={editor}
                className="p-4 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
              />
            </div>
          </div>
        </div>

        {/* Detail Images */}
        <div className="w-full">
          <div className="border border-[#B7B7B7] rounded-[12px] bg-white p-6">
            <Label className="text-sm font-medium text-[#002040] block mb-1">
              상세 설명 이미지
            </Label>
            <p className="text-xs text-[#777777] mb-1">
              프로덕트의 스크린샷 또는 관련 설명 이미지가 있다면 추가해주세요.
              (최대 5장)
            </p>
            <p className="text-xs text-[#777777] mb-6">
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
              <div className="w-12 h-12 bg-[#1C1F26] rounded-[8px] flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/logo_showcase.png"
                  alt="Showcase Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-[8px] flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/up_arrow.png"
                  alt="Up Arrow"
                  fill
                  className="object-cover"
                />
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
          <Label className="text-sm font-medium text-[#002040]">
            프로덕트 링크 <span className="text-red-500">*</span>
          </Label>
          <div className="bg-white border border-[#B7B7B7] rounded-[12px] p-4 space-y-4">
            {/* Website Link */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-black" />
                <span className="text-sm font-medium text-[#002040]">
                  웹사이트 링크
                </span>
                <Plus className="ml-auto w-5 h-5 text-[#777777] cursor-pointer" />
              </div>
              <Input
                placeholder="https://www.syde.kr"
                className="h-[36px] bg-white border-[#B7B7B7] rounded-[10px] text-sm placeholder:text-[#777777]"
              />
              <p className="text-xs text-[#777777]">예) https://www.syde.kr</p>
            </div>
            <div className="h-px bg-[#F1F1F1] my-2" />
            {/* Google Play */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-black fill-current"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                </svg>
                <span className="text-sm font-medium text-[#002040]">
                  Google Play 링크
                </span>
              </div>
              <p className="text-xs text-[#777777] pl-8">
                예) https://www.syde.kr
              </p>
            </div>
            <div className="h-px bg-[#F1F1F1] my-2" />
            {/* App Store */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-black fill-current"
                  viewBox="0 0 64 64"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M49.424 34c-.1-8.1 6.581-12 6.88-12.2a14.581 14.581 0 0 0-11.667-6.3c-4.986-.5-9.672 2.9-12.265 2.9-2.493 0-6.382-2.9-10.57-2.8a15.75 15.75 0 0 0-13.162 8c-5.584 9.8-1.4 24.4 4.088 32.3 2.692 3.9 5.883 8.3 10.071 8.1 4.088-.2 5.584-2.6 10.47-2.6s6.282 2.6 10.57 2.5c4.388-.1 7.08-4 9.772-7.9A31.77 31.77 0 0 0 58 46.9 13.956 13.956 0 0 1 49.424 34zm-8.077-23.8A14.32 14.32 0 0 0 44.638 0a14.075 14.075 0 0 0-9.373 4.8c-2.094 2.4-3.889 6.2-3.39 9.9 3.589.3 7.279-1.8 9.472-4.5z" />
                </svg>
                <span className="text-sm font-medium text-[#002040]">
                  App Store 링크
                </span>
              </div>
              <p className="text-xs text-[#777777] pl-8">
                예) https://www.syde.kr
              </p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#002040]">
            팀원 등록
          </Label>
          <p className="text-xs text-[#777777]">
            SYDE 프로덕트를 같이 만든 팀원이 있다면 추가해주세요.
          </p>

          <div className="flex items-center gap-2 border border-[#B7B7B7] rounded-[12px] bg-white p-2">
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
            className="rounded-full w-24 border-[#B7B7B7] text-[#777777] hover:bg-gray-50"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-[12px] bg-[#002040] hover:bg-[#002040]/90"
            disabled={isSubmitting}
          >
            등록하기
          </Button>
        </div>
      </form>
    </div>
  );
}
