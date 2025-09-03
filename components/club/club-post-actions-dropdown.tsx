
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteClubPost } from "@/app/socialing/club/club-actions";
import { Database } from "@/types/database.types";

type Post = Database["public"]["Tables"]["club_forum_posts"]["Row"];

interface ClubPostActionsDropdownProps {
  post: Post;
  clubId: string;
  onEditClick: () => void; // Added prop
}

export function ClubPostActionsDropdown({ post, clubId, onEditClick }: ClubPostActionsDropdownProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmation = window.confirm(
      "정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );
    if (!confirmation) return;

    setIsDeleting(true);
    const result = await deleteClubPost(post.id);
    setIsDeleting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("게시글이 삭제되었습니다.");
      router.push(`/socialing/club/${clubId}`);
    }
  };

  const handleEdit = () => {
    onEditClick(); // Call the prop function
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>수정</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-500">
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          <span>{isDeleting ? "삭제 중..." : "삭제"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
