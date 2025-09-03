"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Tables } from '@/types/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import TiptapEditorWrapper from '@/components/common/tiptap-editor-wrapper';
import { JSONContent } from '@tiptap/react';
import { createClub, updateClub } from '@/app/socialing/club/club-actions';

interface ClubFormProps {
  club?: Tables<'clubs'>;
}

export default function ClubEditForm({ club }: ClubFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!club;

  const [name, setName] = useState(club?.name || '');
  const [tagline, setTagline] = useState(club?.tagline || '');
  const [description, setDescription] = useState<JSONContent | null>(() => {
    if (club?.description) {
      if (typeof club.description === 'object' && club.description !== null) {
        return club.description as JSONContent;
      }
      if (typeof club.description === 'string') {
        try {
          return JSON.parse(club.description);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(club?.thumbnail_url || null);
  const [descriptionImages, setDescriptionImages] = useState<{ file: File; blobUrl: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      descriptionImages.forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl));
    };
  }, [descriptionImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const newPreviewUrl = URL.createObjectURL(file);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(newPreviewUrl);
    }
  };

  const handleDescriptionImageAdded = (file: File, blobUrl: string) => {
    setDescriptionImages((prev) => [...prev, { file, blobUrl }]);
  };

  const clientAction = async (formData: FormData) => {
    setIsSubmitting(true);

    formData.append('name', name);
    formData.append('tagline', tagline);
    formData.append('description', JSON.stringify(description));

    if (isEditMode && club) {
      formData.append('id', club.id);
    }
    if (thumbnailFile) {
      formData.append('thumbnailFile', thumbnailFile);
    }

    descriptionImages.forEach((img, index) => {
      formData.append('descriptionImageFiles', img.file);
      formData.append(`descriptionImageBlobUrl_${index}`, img.blobUrl);
    });

    const result = isEditMode
      ? await updateClub(formData)
      : await createClub(formData);

    if (result?.error) {
      toast.error(`클럽 ${isEditMode ? '업데이트' : '생성'} 실패: ${result.error}`);
    } else {
      toast.success(`클럽이 성공적으로 ${isEditMode ? '업데이트되었습니다' : '생성되었습니다'}.`);
      const clubId = isEditMode ? club.id : (result as { clubId: string }).clubId;
      router.push(`/socialing/club/${clubId}`);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  return (
    <form action={clientAction} ref={formRef} className="w-full max-w-2xl space-y-6 p-4 bg-white rounded-lg shadow-md">
       <div>
        <Label htmlFor="name">클럽 이름</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="tagline">한 줄 소개</Label>
        <Input
          id="tagline"
          name="tagline"
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="클럽을 한 줄로 소개해주세요."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">클럽 설명</Label>
        <TiptapEditorWrapper
          initialContent={description}
          onContentChange={(json) => setDescription(json)}
          placeholder="클럽 설명을 입력하세요..."
          onImageUpload={async (file) => {
            const blobUrl = URL.createObjectURL(file);
            handleDescriptionImageAdded(file, blobUrl);
            return blobUrl;
          }}
        />
      </div>

      <div>
        <Label htmlFor="thumbnail">썸네일 이미지</Label>
        <div className="mt-1 flex flex-col items-center space-y-4">
          {previewUrl && (
            <div className="w-full h-64 relative">
              <Image
                src={previewUrl}
                alt="Thumbnail preview"
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          <Input
            id="thumbnailFile"
            name="thumbnailFile"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            이미지 선택
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (isEditMode ? '저장 중...' : '생성 중...') : (isEditMode ? '정보 저장' : '클럽 생성')}
      </Button>
    </form>
  );
}