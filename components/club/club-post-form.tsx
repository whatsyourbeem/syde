'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClubPost } from '@/app/gathering/club/actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import TiptapEditorWrapper from '@/components/common/tiptap-editor-wrapper';
import { Json } from '@/types/database.types';
import { JSONContent } from '@tiptap/react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  forumId: string;
}

export default function ClubPostForm({ forumId }: ClubPostFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent | null>(null);

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
      const result = await createClubPost(forumId, title, content as Json);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('게시글이 성공적으로 등록되었습니다.');
        setTitle('');
        // Resetting the content by passing null, TiptapEditorWrapper will handle it
        setContent(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('게시글 등록 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
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
      <TiptapEditorWrapper
        initialContent={content}
        onContentChange={setContent}
        placeholder="클럽 멤버들과 나눌 이야기를 작성해보세요..."
      />
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isLoading ? '등록 중...' : '게시글 등록'}
        </Button>
      </div>
    </div>
  );
}