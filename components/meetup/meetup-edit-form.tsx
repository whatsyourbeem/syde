"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createMeetup, updateMeetup, uploadMeetupThumbnail } from "@/app/socialing/actions";
import { toast } from "sonner";
import { Tables, Enums } from "@/types/database.types";
import MeetupDescriptionEditor from "@/components/meetup/meetup-description-editor";
import { JSONContent } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";

type Meetup = Tables<"meetups">;

interface MeetupEditFormProps {
  meetup?: Meetup;
  clubId?: string;
}

export default function MeetupEditForm({ meetup, clubId }: MeetupEditFormProps) {
  const router = useRouter();
  const isEditMode = !!meetup;

  // Use state to hold the ID, generating a new one only for create mode.
  const [id] = useState(meetup?.id || uuidv4());

  const [title, setTitle] = useState(meetup?.title || "");
  const [description, setDescription] = useState<JSONContent | null>(() => {
      if (meetup?.description) {
          try {
              // Type assertion to treat it as a string first
              const parsed = JSON.parse(meetup.description as unknown as string);
              return parsed;
          } catch (e) {
              console.error("Failed to parse description JSON:", e);
              return { type: 'doc', content: [] };
          }
      }
      return { type: 'doc', content: [] };
  });
  const [category, setCategory] = useState<Enums<"meetup_category_enum"> | undefined>(meetup?.category);
  const [locationType, setLocationType] = useState<Enums<"meetup_location_type_enum"> | undefined>(meetup?.location_type);
  const [status, setStatus] = useState<Enums<"meetup_status_enum"> | undefined>(meetup?.status);
  const [startDatetime, setStartDatetime] = useState(
    meetup?.start_datetime
      ? new Date(meetup.start_datetime).toISOString().slice(0, 16)
      : ""
  );
  const [endDatetime, setEndDatetime] = useState(
    meetup?.end_datetime
      ? new Date(meetup.end_datetime).toISOString().slice(0, 16)
      : ""
  );
  const [locationDescription, setLocationDescription] = useState(meetup?.location_description || "");
  const [maxParticipants, setMaxParticipants] = useState<number | string>(meetup?.max_participants || "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(meetup?.thumbnail_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(meetup?.thumbnail_url || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!category || !locationType || !status) {
        toast.error("카테고리, 진행 방식, 상태를 모두 선택해주세요.");
        setIsSubmitting(false);
        return;
    }

    let finalThumbnailUrl = meetup?.thumbnail_url;
    if (thumbnailFile) {
      const thumbnailFormData = new FormData();
      thumbnailFormData.append("file", thumbnailFile);
      thumbnailFormData.append("meetupId", id); // Use the state ID

      const uploadResult = await uploadMeetupThumbnail(thumbnailFormData);
      if (uploadResult?.error) {
        toast.error("썸네일 이미지 업로드 실패: " + uploadResult.error);
        setIsSubmitting(false);
        return;
      }
      finalThumbnailUrl = uploadResult.publicUrl;
    }

    const formData = new FormData();
    formData.append("id", id);
    formData.append("title", title);
    formData.append("description", JSON.stringify(description));
    formData.append("thumbnailUrl", finalThumbnailUrl || "");
    formData.append("category", category);
    formData.append("locationType", locationType);
    formData.append("status", status);
    formData.append("startDatetime", startDatetime);
    formData.append("endDatetime", endDatetime);
    formData.append("locationDescription", locationDescription);
    formData.append("maxParticipants", maxParticipants.toString());
    if (clubId) {
        formData.append("clubId", clubId);
    }

    const result = isEditMode ? await updateMeetup(formData) : await createMeetup(formData);

    if (result?.error) {
      toast.error(`모임 ${isEditMode ? '업데이트' : '생성'} 실패: ${result.error}`);
    } else {
      toast.success(`모임이 성공적으로 ${isEditMode ? '업데이트되었습니다' : '생성되었습니다'}.`);
      router.push(`/socialing/meetup/${id}`);
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    if (isEditMode) {
      router.push(`/socialing/meetup/${meetup.id}`);
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          모임 제목
        </label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          모임 상세 설명
        </label>
        <MeetupDescriptionEditor
          initialDescription={description}
          onDescriptionChange={setDescription}
          meetupId={id} // Pass the consistent ID
        />
      </div>

      <div>
        <label htmlFor="thumbnailFile" className="block text-sm font-medium text-gray-700 mb-1">
          썸네일 이미지
        </label>
        {thumbnailPreview && (
          <Image
            src={thumbnailPreview}
            alt="썸네일 미리보기"
            width={192}
            height={128}
            className="w-48 h-32 object-cover rounded-md mb-2"
          />
        )}
        <Input id="thumbnailFile" type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            카테고리
          </label>
          <Select value={category} onValueChange={(value: Enums<"meetup_category_enum">) => setCategory(value)} required>
            <SelectTrigger>
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="스터디">스터디</SelectItem>
              <SelectItem value="챌린지">챌린지</SelectItem>
              <SelectItem value="네트워킹">네트워킹</SelectItem>
              <SelectItem value="기타">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-1">
            진행 방식
          </label>
          <Select value={locationType} onValueChange={(value: Enums<"meetup_location_type_enum">) => setLocationType(value)} required>
            <SelectTrigger>
              <SelectValue placeholder="진행 방식 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="온라인">온라인</SelectItem>
              <SelectItem value="오프라인">오프라인</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          상태
        </label>
        <Select value={status} onValueChange={(value: Enums<"meetup_status_enum">) => setStatus(value)} required>
          <SelectTrigger>
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="오픈예정">오픈예정</SelectItem>
            <SelectItem value="신청가능">신청가능</SelectItem>
            <SelectItem value="신청마감">신청마감</SelectItem>
            <SelectItem value="종료">종료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="startDatetime" className="block text-sm font-medium text-gray-700 mb-1">
            시작 일시
          </label>
          <Input id="startDatetime" type="datetime-local" value={startDatetime} onChange={(e) => setStartDatetime(e.target.value)} />
        </div>
        <div>
          <label htmlFor="endDatetime" className="block text-sm font-medium text-gray-700 mb-1">
            종료 일시
          </label>
          <Input id="endDatetime" type="datetime-local" value={endDatetime} onChange={(e) => setEndDatetime(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="locationDescription" className="block text-sm font-medium text-gray-700 mb-1">
          장소 상세 설명
        </label>
        <Input id="locationDescription" value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} />
      </div>

      <div>
        <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
          최대 인원 (비워두면 무제한)
        </label>
        <Input id="maxParticipants" type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} min="1" />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? "저장 중..." : "생성 중...") : (isEditMode ? "저장" : "생성")}
        </Button>
      </div>
    </form>
  );
}