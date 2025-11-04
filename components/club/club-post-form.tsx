'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClubPost, updateClubPost } from '@/app/club/club-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const TiptapEditorWrapper = dynamic(
  () => import('@/components/common/tiptap-editor-wrapper'),
  {
    loading: () => <div className="h-32 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">에디터 로딩 중...</div>,
    ssr: false
  }
);
import { Json, Tables, Enums } from '@/types/database.types';
import { JSONContent } from '@tiptap/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from '@/lib/constants';

type Forum = Tables<'club_forums'>;

function isJsonContentEmpty(content: JSONContent | null): boolean {
  if (!content || !content.content) return true;
  return content.content.every(node => node.type === 'paragraph' && !node.content);
}

interface ClubPostFormProps {
  clubId: string;
  forums?: Forum[];
  userRole?: Enums<'club_member_role_enum'> | null;
  isOwner?: boolean;
  initialForumId?: string;
  initialData?: { title: string; content: Json | null; postId?: string; forumId?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClubPostForm({ clubId, forums, userRole, isOwner, initialForumId, initialData, onSuccess = () => {}, onCancel = () => {} }: ClubPostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState<JSONContent | null>((initialData?.content as JSONContent) || null);
  const [descriptionImages, setDescriptionImages] = useState<{ file: File; blobUrl: string }[]>([]);

  useEffect(() => {
    return () => {
      descriptionImages.forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl));
    };
  }, [descriptionImages]);

  const handleDescriptionImageAdded = (file: File, blobUrl: string) => {
    setDescriptionImages((prev) => [...prev, { file, blobUrl }]);
  };

  const canWriteForum = (forum: Forum) => {
    const permission = forum.write_permission;
    if (isOwner) return true;
    if (!userRole) return false;
    if (permission === CLUB_PERMISSION_LEVELS.MEMBER) return true;
    if (permission === CLUB_PERMISSION_LEVELS.FULL_MEMBER) return userRole === CLUB_MEMBER_ROLES.FULL_MEMBER || userRole === CLUB_MEMBER_ROLES.LEADER;
    if (permission === CLUB_PERMISSION_LEVELS.LEADER) return userRole === CLUB_MEMBER_ROLES.LEADER;
    return false;
  };

  const [selectedForumId, setSelectedForumId] = useState<string>(() => {
    if (initialData?.postId) return initialData.forumId || '';
    const firstWritableForum = forums?.find(canWriteForum);
    if (initialForumId && forums && canWriteForum(forums.find(f => f.id === initialForumId) || {} as Forum)) {
      return initialForumId;
    }
    return firstWritableForum?.id || '';
  });

  const hasWritableForums = forums?.some(canWriteForum);

  const clientAction = async (formData: FormData) => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (isJsonContentEmpty(content)) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    formData.append('title', title);
    formData.append('content', JSON.stringify(content));
    formData.append('clubId', clubId);

    if (initialData?.postId) {
      formData.append('postId', initialData.postId);
    } else {
      if (!selectedForumId) {
        toast.error('게시판을 선택해주세요.');
        setIsLoading(false);
        return;
      }
      formData.append('forumId', selectedForumId);
    }

    descriptionImages.forEach((img, index) => {
      formData.append('descriptionImageFiles', img.file);
      formData.append(`descriptionImageBlobUrl_${index}`, img.blobUrl);
    });

    try {
      const result = initialData?.postId
        ? await updateClubPost(formData)
        : await createClubPost(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(initialData?.postId ? '게시글이 성공적으로 수정되었습니다.' : '게시글이 성공적으로 등록되었습니다.');
        onSuccess();
        if (!initialData?.postId) {
          router.push(`/club/${clubId}/post/${result.postId}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(initialData?.postId ? '게시글 수정 중 예기치 않은 오류가 발생했습니다.' : '게시글 등록 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form ref={formRef} action={clientAction} className="flex flex-col gap-4">
      {!initialData?.postId && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="forum">게시판</Label>
          <Select onValueChange={setSelectedForumId} value={selectedForumId} disabled={isLoading || !hasWritableForums}>
            <SelectTrigger id="forum">
              <SelectValue placeholder="게시판을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {forums && forums.length === 0 ? (
                <SelectItem value="" disabled>게시판이 없습니다.</SelectItem>
              ) : (
                forums?.map(forum => (
                  <SelectItem key={forum.id} value={forum.id} disabled={!canWriteForum(forum)}>
                    {forum.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="title">제목</Label>
        <Input
          type="text"
          id="title"
          name="title"
          placeholder="게시글 제목을 입력하세요."
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="content">내용</Label>
        <div className="border border-input rounded-md p-4 min-h-[400px]">
          <TiptapEditorWrapper
            initialContent={content}
            onContentChange={setContent}
            placeholder="클럽 멤버들과 나눌 이야기를 작성해보세요..."
            onImageUpload={async (file) => {
              const blobUrl = URL.createObjectURL(file);
              handleDescriptionImageAdded(file, blobUrl);
              return blobUrl;
            }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {initialData?.postId && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>취소</Button>
        )}
        <Button type="submit" disabled={isLoading || (!initialData?.postId && (!hasWritableForums || !selectedForumId || !canWriteForum(forums?.find(f => f.id === selectedForumId) || {} as Forum)))}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isLoading ? (initialData?.postId ? '수정 중...' : '등록 중...') : '게시글 등록'}
        </Button>
      </div>
    </form>
  );
}
