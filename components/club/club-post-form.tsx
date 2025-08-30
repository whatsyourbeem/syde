'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClubPost, updateClubPost } from '@/app/socialing/club/actions'; // Added updateClubPost
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import TiptapEditorWrapper from '@/components/common/tiptap-editor-wrapper';
import { Json, Tables, Enums } from '@/types/database.types';
import { JSONContent } from '@tiptap/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLUB_MEMBER_ROLES, CLUB_PERMISSION_LEVELS } from '@/lib/constants';

type Forum = Tables<'club_forums'>;

// A helper function to check if TipTap content is empty
function isJsonContentEmpty(content: JSONContent | null): boolean {
  if (!content || !content.content) {
    return true;
  }
  return content.content.every(node => {
    if (node.type === 'paragraph' && !node.content) {
      return true;
    }
    return false;
  });
}

interface ClubPostFormProps {
  clubId: string;
  forums?: Forum[]; // Make optional for edit mode
  userRole?: Enums<'club_member_role_enum'> | null; // Make optional for edit mode
  isOwner?: boolean; // Make optional for edit mode
  initialForumId?: string; // Make optional for edit mode
  initialData?: { title: string; content: Json | null; postId?: string; forumId?: string }; // Added forumId for edit mode
  onSuccess?: () => void; // Make optional
  onCancel?: () => void; // Make optional
}

export default function ClubPostForm({ clubId, forums, userRole, isOwner, initialForumId, initialData, onSuccess = () => {}, onCancel = () => {} }: ClubPostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState<JSONContent | null>((initialData?.content as JSONContent) || null);

  const canWriteForum = (forum: Forum) => {
    const permission = forum.write_permission;
    if (isOwner) return true; // Owner can write to any forum
    if (!userRole) return false; // Not a member, cannot write

    if (permission === CLUB_PERMISSION_LEVELS.MEMBER) {
      return true; // Any member can write
    } else if (permission === CLUB_PERMISSION_LEVELS.FULL_MEMBER) {
      return userRole === CLUB_MEMBER_ROLES.FULL_MEMBER || userRole === CLUB_MEMBER_ROLES.LEADER;
    } else if (permission === CLUB_PERMISSION_LEVELS.LEADER) {
      return userRole === CLUB_MEMBER_ROLES.LEADER;
    }
    return false;
  };

  const [selectedForumId, setSelectedForumId] = useState<string>(() => {
    // Only set initialForumId if in create mode
    if (initialData?.postId) return initialData.forumId || ''; // In edit mode, use forumId from initialData

    const firstWritableForum = forums?.find(canWriteForum);
    if (initialForumId && forums && canWriteForum(forums.find(f => f.id === initialForumId) || {} as Forum)) {
      return initialForumId;
    }
    return firstWritableForum?.id || '';
  });

  const hasWritableForums = forums?.some(canWriteForum); // Make forums optional

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (isJsonContentEmpty(content)) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (initialData?.postId) { // Edit mode
        result = await updateClubPost(initialData.postId, title, content as Json);
      } else { // Create mode
        if (!selectedForumId) {
          toast.error('게시판을 선택해주세요.');
          return;
        }
        result = await createClubPost(selectedForumId, title, content as Json);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(initialData?.postId ? '게시글이 성공적으로 수정되었습니다.' : '게시글이 성공적으로 등록되었습니다.');
        onSuccess(); // Call onSuccess callback
        if (!initialData?.postId) { // Only clear form and redirect on create
          setTitle('');
          setContent(null);
          router.push(`/socialing/club/${clubId}/post/${result.postId}`);
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
    <div className="flex flex-col gap-4">
      {!initialData?.postId && ( // Only show forum selection in create mode
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="forum">게시판</Label>
          <Select onValueChange={setSelectedForumId} value={selectedForumId} disabled={isLoading || !hasWritableForums}>
            <SelectTrigger id="forum">
              <SelectValue placeholder="게시판을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {forums && forums.length === 0 ? ( // Check if forums exist
                <SelectItem value="" disabled>
                  게시판이 없습니다.
                </SelectItem>
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
          />
        </div>
      </div>
      <div className="flex justify-end gap-2"> {/* Added gap-2 for spacing between buttons */}
        {initialData?.postId && ( // Show cancel button only in edit mode
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isLoading || (!initialData?.postId && (!hasWritableForums || !selectedForumId || !canWriteForum(forums?.find(f => f.id === selectedForumId) || {} as Forum)))}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isLoading ? (initialData?.postId ? '수정 중...' : '등록 중...') : (initialData?.postId ? '게시글 수정' : '게시글 등록')}
        </Button>
      </div>
    </div>
  );
}