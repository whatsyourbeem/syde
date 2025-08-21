"use client";

import { useState, useTransition } from "react";
import { Tables, Enums } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createForum,
  updateForumName,
  updateForumPermissions,
  deleteForum,
} from "@/app/gathering/club/actions";
import { Loader2, Trash2, Edit, Save, PlusCircle, X } from "lucide-react";
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
import Link from "next/link";

type Forum = Tables<"club_forums">;
type Club = Tables<"clubs">;
type PermissionLevel = Enums<"club_permission_level_enum">;

interface ClubForumManagementPageProps {
  club: Club;
  initialForums: Forum[];
}

const permissionLevels: PermissionLevel[] = [
  "PUBLIC",
  "MEMBER",
  "FULL_MEMBER",
  "LEADER",
];

const permissionKorean: Record<PermissionLevel, string> = {
  PUBLIC: "전체 공개",
  MEMBER: "멤버 공개",
  FULL_MEMBER: "정회원",
  LEADER: "클럽장",
};

export default function ClubForumManagementPage({
  club,
  initialForums,
}: ClubForumManagementPageProps) {
  const [editingForumId, setEditingForumId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newForumName, setNewForumName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateForum = () => {
    if (newForumName.trim() === "") {
      toast.error("게시판 이름을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      const result = await createForum(club.id, newForumName.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`'${newForumName.trim()}' 게시판이 생성되었습니다.`);
        setNewForumName("");
        // No need to manually update state, revalidation will handle it
      }
    });
  };

  const handleUpdatePermissions = (
    forumId: string,
    read: PermissionLevel,
    write: PermissionLevel
  ) => {
    startTransition(async () => {
      const result = await updateForumPermissions({
        forumId,
        clubId: club.id,
        readPermission: read,
        writePermission: write,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("권한이 업데이트되었습니다.");
      }
    });
  };

  const handleEditName = (forum: Forum) => {
    setEditingForumId(forum.id);
    setEditingName(forum.name);
  };

  const handleCancelEdit = () => {
    setEditingForumId(null);
    setEditingName("");
  }

  const handleSaveName = (forumId: string) => {
     if (editingName.trim() === "") {
      toast.error("게시판 이름은 비워둘 수 없습니다.");
      return;
    }
    startTransition(async () => {
      const result = await updateForumName(forumId, editingName, club.id);
       if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("게시판 이름이 변경되었습니다.");
        setEditingForumId(null);
        setEditingName("");
      }
    });
  }

  const handleDeleteForum = (forumId: string) => {
    startTransition(async () => {
      const result = await deleteForum(forumId, club.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("게시판이 삭제되었습니다.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/gathering/club/${club.id}`}>
          <Button variant="outline" className="mb-4"> &larr; {club.name} 클럽으로 돌아가기</Button>
        </Link>
        <h1 className="text-3xl font-bold">게시판 관리</h1>
        <p className="text-muted-foreground">
          클럽의 게시판을 추가, 수정, 삭제하고 권한을 설정합니다.
        </p>
      </div>

      {/* Create New Forum */}
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-lg font-semibold mb-4">새 게시판 생성</h2>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="게시판 이름"
            value={newForumName}
            onChange={(e) => setNewForumName(e.target.value)}
            className="max-w-xs"
            disabled={isPending}
          />
          <Button onClick={handleCreateForum} disabled={isPending || !newForumName.trim()}>
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <PlusCircle className="mr-2 size-4"/>}
            생성
          </Button>
        </div>
      </div>

      {/* Forum List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">게시판 목록</h2>
        {initialForums.map((forum) => (
          <div
            key={forum.id}
            className="flex flex-col gap-4 p-4 border rounded-md bg-card"
          >
            <div className="flex justify-between items-center">
                {editingForumId === forum.id ? (
                    <div className="flex gap-2 items-center flex-grow">
                        <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="max-w-xs" disabled={isPending}/>
                        <Button size="icon" variant="ghost" onClick={() => handleSaveName(forum.id)} disabled={isPending}><Save className="size-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={handleCancelEdit} disabled={isPending}><X className="size-4"/></Button>
                    </div>
                ) : (
                    <h3 className="font-semibold text-lg">{forum.name}</h3>
                )}

              <div className="flex items-center gap-2">
                {editingForumId !== forum.id && (
                    <Button size="icon" variant="ghost" onClick={() => handleEditName(forum)}><Edit className="size-4"/></Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive/80">
                        <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &apos;{forum.name}&apos; 게시판을 삭제합니다. 이 작업은 되돌릴 수 없습니다. 게시글이 있는 게시판은 삭제할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteForum(forum.id)} className="bg-destructive hover:bg-destructive/80">삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">읽기 권한</label>
                <Select
                  defaultValue={forum.read_permission}
                  onValueChange={(value: PermissionLevel) =>
                    handleUpdatePermissions(forum.id, value, forum.write_permission)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionLevels.map((level) => (
                      <SelectItem key={`read-${level}`} value={level}>
                        {permissionKorean[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">쓰기 권한</label>
                <Select
                  defaultValue={forum.write_permission}
                  onValueChange={(value: PermissionLevel) =>
                    handleUpdatePermissions(forum.id, forum.read_permission, value)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionLevels.map((level) => (
                      <SelectItem key={`write-${level}`} value={level}>
                        {permissionKorean[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
