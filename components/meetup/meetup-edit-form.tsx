"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createMeetup, updateMeetup } from "@/app/socialing/meetup/actions";
import { toast } from "sonner";
import { Tables, Enums } from "@/types/database.types";
import MeetupDescriptionEditor from "@/components/meetup/meetup-description-editor";
import { DatePicker } from "@/components/ui/date-picker-with-time";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";
import { JSONContent } from "@tiptap/react";
import {
  MEETUP_CATEGORIES,
  MEETUP_LOCATION_TYPES,
  MEETUP_STATUSES,
} from "@/lib/constants";

type Meetup = Tables<"meetups">;

interface MeetupEditFormProps {
  meetup?: Meetup;
  clubId?: string;
}

export default function MeetupEditForm({
  meetup,
  clubId,
}: MeetupEditFormProps) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const isEditMode = !!meetup;

  const [title, setTitle] = useState(meetup?.title || "");
  const [description, setDescription] = useState<JSONContent | null>(() => {
    if (meetup?.description) {
      try {
        return JSON.parse(meetup.description as unknown as string);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [category, setCategory] = useState<Enums<"meetup_category_enum"> | undefined>(meetup?.category);
  const [locationType, setLocationType] = useState<Enums<"meetup_location_type_enum"> | undefined>(meetup?.location_type);
  const [status, setStatus] = useState<Enums<"meetup_status_enum"> | undefined>(meetup?.status);
  const [startDatetime, setStartDatetime] = useState<Date | undefined>(
    meetup?.start_datetime ? new Date(meetup.start_datetime) : undefined
  );
  const [endDatetime, setEndDatetime] = useState<Date | undefined>(
    meetup?.end_datetime ? new Date(meetup.end_datetime) : undefined
  );
  const [locationDescription, setLocationDescription] = useState(meetup?.location_description || "");
  const [maxParticipants, setMaxParticipants] = useState<number | string>(meetup?.max_participants || "");
  
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(meetup?.thumbnail_url || null);
  const [descriptionImages, setDescriptionImages] = useState<{ file: File; blobUrl: string }[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Clean up blob URLs on unmount
    return () => {
      descriptionImages.forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl));
    };
  }, [descriptionImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(meetup?.thumbnail_url || null);
    }
  };

  const handleDescriptionImageAdded = (file: File, blobUrl: string) => {
    setDescriptionImages((prev) => [...prev, { file, blobUrl }]);
  };

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true);

    if (!category || !locationType || !status || !startDatetime || !endDatetime) {
      toast.error("필수 항목을 모두 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    formData.append("title", title);
    formData.append("description", JSON.stringify(description));
    formData.append("category", category);
    formData.append("locationType", locationType);
    formData.append("status", status);
    formData.append("startDatetime", startDatetime.toISOString());
    formData.append("endDatetime", endDatetime.toISOString());
    formData.append("locationDescription", locationDescription);
    formData.append("maxParticipants", maxParticipants.toString());

    if (isEditMode && meetup) {
      formData.append("id", meetup.id);
    }
    if (clubId) {
      formData.append("clubId", clubId);
    }
    if (thumbnailFile) {
      formData.append("thumbnailFile", thumbnailFile);
    }

    descriptionImages.forEach((img, index) => {
      formData.append("descriptionImageFiles", img.file);
      formData.append(`descriptionImageBlobUrl_${index}`, img.blobUrl);
    });

    const result = isEditMode
      ? await updateMeetup(formData)
      : await createMeetup(formData);

    if (result?.error) {
      toast.error(`모임 ${isEditMode ? "업데이트" : "생성"} 실패: ${result.error}`);
    } else {
      toast.success(`모임이 성공적으로 ${isEditMode ? "업데이트되었습니다" : "생성되었습니다"}.`);
      const meetupId = isEditMode ? meetup.id : result.meetupId;
      router.push(`/socialing/meetup/${meetupId}`);
    }
    setIsSubmitting(false);
  };

  return (
    <form ref={formRef} action={clientAction} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
          모임 제목 <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
          모임 상세 설명
        </label>
        <MeetupDescriptionEditor
          initialDescription={description}
          onDescriptionChange={setDescription}
          onImageAdded={handleDescriptionImageAdded}
        />
      </div>

      <div>
        <Label htmlFor="thumbnailFile" className="text-sm font-semibold text-gray-700 mb-1">
          썸네일 이미지
        </Label>
        <div className="flex items-center gap-4">
          <div
            className="relative w-48 h-32 rounded-md overflow-hidden cursor-pointer bg-gray-100"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => document.getElementById("thumbnailFile")?.click()}
          >
            <Image
              src={thumbnailPreview || "/default_club_thumbnail.png"}
              alt="썸네일 미리보기"
              fill
              className={`object-cover object-center w-full h-full transition-opacity duration-300 ${
                isHovered ? "opacity-50" : "opacity-100"}`}
            />
            <div
              className={`absolute inset-0 flex items-center justify-center bg-black transition-opacity duration-300 z-10 ${
                isHovered ? "opacity-50" : "opacity-0"}`}
            >
              <Plus className="w-12 h-12" color="white" />
            </div>
          </div>
          <div className="space-y-2">
            <Input
              id="thumbnailFile"
              name="thumbnailFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button type="button" onClick={() => document.getElementById("thumbnailFile")?.click()}>
              파일 선택
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex gap-2">
          <DatePicker label="시작 날짜" date={startDatetime} setDate={setStartDatetime} required />
          <TimePicker
            label="시작 시간"
            date={startDatetime}
            setDate={setStartDatetime}
            className="w-42"
            required
          />
        </div>
        <div className="flex gap-2">
          <DatePicker label="종료 날짜" date={endDatetime} setDate={setEndDatetime} required />
          <TimePicker
            label="종료 시간"
            date={endDatetime}
            setDate={setEndDatetime}
            className="w-42"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <Select value={category} onValueChange={(value: Enums<"meetup_category_enum">) => setCategory(value)} required>
            <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
            <SelectContent>
              {Object.entries(MEETUP_CATEGORIES).map(([key, value]) => (
                <SelectItem key={key} value={value}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="locationType" className="block text-sm font-semibold text-gray-700 mb-1">
            진행 방식 <span className="text-red-500">*</span>
          </label>
          <Select value={locationType} onValueChange={(value: Enums<"meetup_location_type_enum">) => setLocationType(value)} required>
            <SelectTrigger><SelectValue placeholder="진행 방식 선택" /></SelectTrigger>
            <SelectContent>
              {Object.entries(MEETUP_LOCATION_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={value}>{key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-1">
          상태 <span className="text-red-500">*</span>
        </label>
        <Select value={status} onValueChange={(value: Enums<"meetup_status_enum">) => setStatus(value)} required>
          <SelectTrigger><SelectValue placeholder="상태 선택" /></SelectTrigger>
          <SelectContent>
            {Object.entries(MEETUP_STATUSES).map(([key, value]) => (
              <SelectItem key={key} value={value}>{key}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="locationDescription" className="block text-sm font-semibold text-gray-700 mb-1">
          장소 상세 설명
        </label>
        <Input id="locationDescription" name="locationDescription" value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} />
      </div>

      <div>
        <label htmlFor="maxParticipants" className="block text-sm font-semibold text-gray-700 mb-1">
          최대 인원 (비워두면 무제한)
        </label>
        <Input id="maxParticipants" name="maxParticipants" type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} min="1" />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          취소
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? "저장 중..." : "생성 중...") : (isEditMode ? "저장" : "생성")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>저장하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                입력한 내용으로 모임을 {isEditMode ? "수정" : "생성"}합니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting}>
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  );
}
