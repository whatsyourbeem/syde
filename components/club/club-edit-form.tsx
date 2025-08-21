"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Tables } from '@/types/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import TiptapEditorWrapper from '@/components/common/tiptap-editor-wrapper';
import { JSONContent } from '@tiptap/react';
import { updateClub, uploadClubThumbnail, uploadClubDescriptionImage } from '@/app/socialing/club/actions';

interface ClubEditFormProps {
  club: Tables<'clubs'>;
}

export default function ClubEditForm({ club }: ClubEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState<JSONContent | null>(() => {
    if (club?.description) {
      if (typeof club.description === 'object' && club.description !== null) {
        return club.description as JSONContent;
      }
      if (typeof club.description === 'string') {
        try {
          return JSON.parse(club.description);
        } catch (e) {
          console.error("Failed to parse club description JSON string:", e);
          return { type: 'doc', content: [] };
        }
      }
    }
    return { type: 'doc', content: [] };
  });
  const [thumbnailUrl] = useState(club.thumbnail_url || '');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(club.thumbnail_url);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let finalThumbnailUrl = thumbnailUrl;

    if (thumbnailFile) {
      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile);

      const uploadResult = await uploadClubThumbnail(club.id, formData);

      if (uploadResult.error || !uploadResult.url) {
        toast.error(uploadResult.error || '썸네일 업로드에 실패했습니다.');
        setIsLoading(false);
        return;
      }
      finalThumbnailUrl = uploadResult.url;
    }

    const result = await updateClub(club.id, name, JSON.stringify(description), finalThumbnailUrl);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('클럽 정보가 성공적으로 업데이트되었습니다.');
      router.push(`/socialing/club/${club.id}`);
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6 p-4 bg-white rounded-lg shadow-md">
      <div>
        <Label htmlFor="name">클럽 이름</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadClubDescriptionImage(club.id, formData);
            if (result.error || !result.url) {
              // The toast is already handled in the wrapper, but you could log here
              console.error(result.error || 'Upload failed');
              return null;
            }
            return result.url;
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
            id="thumbnail"
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

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? '저장 중...' : '정보 저장'}
      </Button>
    </form>
  );
}
