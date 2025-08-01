"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { updateMeetup } from "@/app/meetup/actions";
import { toast } from "sonner";
import { Database, Tables, Enums } from "@/types/database.types";

type Meetup = Tables<'meetups'>;

interface MeetupEditFormProps {
  meetup: Meetup;
}

export default function MeetupEditForm({ meetup }: MeetupEditFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(meetup.title);
  const [description, setDescription] = useState(meetup.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(meetup.thumbnail_url || "");
  const [category, setCategory] = useState<Enums<'meetup_category_enum'>>(meetup.category);
  const [locationType, setLocationType] = useState<Enums<'meetup_location_type_enum'>>(meetup.location_type);
  const [status, setStatus] = useState<Enums<'meetup_status_enum'>>(meetup.status);
  const [startDatetime, setStartDatetime] = useState(meetup.start_datetime ? new Date(meetup.start_datetime).toISOString().slice(0, 16) : "");
  const [endDatetime, setEndDatetime] = useState(meetup.end_datetime ? new Date(meetup.end_datetime).toISOString().slice(0, 16) : "");
  const [locationDescription, setLocationDescription] = useState(meetup.location_description || "");
  const [maxParticipants, setMaxParticipants] = useState<number | string>(meetup.max_participants || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id", meetup.id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnailUrl", thumbnailUrl);
    formData.append("category", category);
    formData.append("locationType", locationType);
    formData.append("status", status);
    formData.append("startDatetime", startDatetime);
    formData.append("endDatetime", endDatetime);
    formData.append("locationDescription", locationDescription);
    formData.append("maxParticipants", maxParticipants.toString());

    const result = await updateMeetup(formData);

    if (result?.error) {
      toast.error("모임 업데이트 실패: " + result.error);
    } else {
      toast.success("모임이 성공적으로 업데이트되었습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">모임 제목</label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">모임 상세 설명</label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
      </div>

      <div>
        <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-gray-700 mb-1">썸네일 이미지 URL</label>
        <Input
          id="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <Select value={category} onValueChange={(value: Enums<'meetup_category_enum'>) => setCategory(value)}>
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
          <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-1">진행 방식</label>
          <Select value={locationType} onValueChange={(value: Enums<'meetup_location_type_enum'>) => setLocationType(value)}>
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
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <Select value={status} onValueChange={(value: Enums<'meetup_status_enum'>) => setStatus(value)}>
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
          <label htmlFor="startDatetime" className="block text-sm font-medium text-gray-700 mb-1">시작 일시</label>
          <Input
            id="startDatetime"
            type="datetime-local"
            value={startDatetime}
            onChange={(e) => setStartDatetime(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="endDatetime" className="block text-sm font-medium text-gray-700 mb-1">종료 일시</label>
          <Input
            id="endDatetime"
            type="datetime-local"
            value={endDatetime}
            onChange={(e) => setEndDatetime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="locationDescription" className="block text-sm font-medium text-gray-700 mb-1">장소 상세 설명</label>
        <Input
          id="locationDescription"
          value={locationDescription}
          onChange={(e) => setLocationDescription(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">최대 인원</label>
        <Input
          id="maxParticipants"
          type="number"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          min="1"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(`/meetup/${meetup.id}`)}>
          취소
        </Button>
        <Button type="submit">
          저장
        </Button>
      </div>
    </form>
  );
}
