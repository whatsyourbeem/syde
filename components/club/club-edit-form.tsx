"use client";

import { useState } from 'react';
import { Tables } from '@/types/database.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import TiptapEditorWrapper from '@/components/common/tiptap-editor-wrapper';
import { JSONContent } from '@tiptap/react';
import { updateClub } from '@/app/gathering/club/actions'; // This action needs to be created

interface ClubEditFormProps {
  club: Tables<'clubs'>;
}

export default function ClubEditForm({ club }: ClubEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState<JSONContent | null>(() => {
    if (club?.description) {
      // Check if it's already an object, if so, use it directly
      if (typeof club.description === 'object' && club.description !== null) {
        return club.description as JSONContent;
      }
      // If it's a string, try to parse it
      if (typeof club.description === 'string') {
        try {
          const parsed = JSON.parse(club.description);
          return parsed;
        } catch (e) {
          console.error("Failed to parse club description JSON string:", e);
          return { type: 'doc', content: [] };
        }
      }
    }
    return { type: 'doc', content: [] }; // Default empty doc
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(club.thumbnail_url || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await updateClub(club.id, name, JSON.stringify(description), thumbnailUrl);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('클럽 정보가 성공적으로 업데이트되었습니다.');
      router.push(`/gathering/club/${club.id}`);
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
        />
      </div>

      <div>
        <Label htmlFor="thumbnailUrl">썸네일 URL</Label>
        <Input
          id="thumbnailUrl"
          type="url"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          className="mt-1"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? '저장 중...' : '정보 저장'}
      </Button>
    </form>
  );
}
