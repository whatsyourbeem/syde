"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Textarea } from "./ui/textarea";
import Image from "next/image";
import { useQueryClient, useMutation } from "@tanstack/react-query"; // Import useQueryClient and useMutation

interface ProfileFormProps {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  link: string | null;
  tagline: string | null;
  className?: string; // Add className prop
}

export default function ProfileForm({
  userId,
  username,
  fullName,
  avatarUrl,
  bio,
  link,
  tagline,
  className,
}: ProfileFormProps) {
  const supabase = createClient();
  const queryClient = useQueryClient(); // Initialize query client
  const [currentUsername, setCurrentUsername] = useState<string | null>(
    username
  );
  const [currentFullName, setCurrentFullName] = useState<string | null>(
    fullName
  );
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    avatarUrl
  );
  const [currentBio, setCurrentBio] = useState<string | null>(bio);
  const [currentLink, setCurrentLink] = useState<string | null>(link);
  const [currentTagline, setCurrentTagline] = useState<string | null>(tagline);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    avatarUrl
  );
  const [isLinkValid, setIsLinkValid] = useState(true); // New state for link validation

  useEffect(() => {
    setCurrentUsername(username);
    setCurrentFullName(fullName);
    setCurrentBio(bio);
    setCurrentLink(link);
    setCurrentTagline(tagline);
    setCurrentAvatarUrl(avatarUrl);
    setAvatarPreviewUrl(avatarUrl);
    // Validate initial link
    if (link) {
      setIsLinkValid(isValidUrl(link));
    }
  }, [username, fullName, avatarUrl, bio, link, tagline]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentLink(value);
    if (value === "") {
      setIsLinkValid(true); // Allow empty string
    } else {
      setIsLinkValid(isValidUrl(value));
    }
  };

  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              }
            },
            file.type,
            quality
          );
        };
      };
    });
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${userId}/${fileName}`; // Store in a user-specific folder

    // Resize image before upload
    const resizedBlob = await resizeImage(file, 300, 300, 0.7); // Max 300x300, 70% quality
    const resizedFile = new File([resizedBlob], fileName, { type: file.type });

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, resizedFile, {
        cacheControl: "3600",
        upsert: true, // Overwrite existing file
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      let newAvatarUrl = currentAvatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        username: currentUsername,
        full_name: currentFullName,
        avatar_url: newAvatarUrl,
        bio: currentBio,
        link: currentLink === "" ? null : currentLink, // Store empty string as null
        tagline: currentTagline, // Add tagline
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }
      return newAvatarUrl;
    },
    onSuccess: (newAvatarUrl) => {
      alert("프로필이 성공적으로 업데이트되었습니다!");
      setCurrentAvatarUrl(newAvatarUrl); // Update state with new URL
      setAvatarFile(null); // Clear file input
      queryClient.invalidateQueries({ queryKey: ["profile", userId] }); // Invalidate profile query
      queryClient.invalidateQueries({ queryKey: ["logs"] }); // Invalidate logs query (for avatar/username changes)
    },
    onError: (error: any) => {
      alert(`프로필 업데이트 중 오류가 발생했습니다: ${error.message}`);
    },
  });

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      updateProfileMutation.mutate();
    },
    [updateProfileMutation]
  );

  return (
    <Card className={`w-full border-0 shadow-none ${className || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-8 pt-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="font-semibold">닉네임</Label>
          <Input
            id="fullName"
            type="text"
            value={currentFullName || ""}
            onChange={(e) => setCurrentFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username" className="font-semibold">프로필 네임</Label>
          <Input
            id="username"
            type="text"
            value={currentUsername || ""}
            onChange={(e) => setCurrentUsername(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">프로필 네임은 프로필 페이지 링크와 연동돼요.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {avatarPreviewUrl && (
              <Image
                src={avatarPreviewUrl}
                alt="Avatar"
                className="rounded-full object-cover"
                width={96}
                height={96}
              />
            )}
            <div className="space-y-2">
              <Label htmlFor="avatar" className="font-semibold">프로필 사진</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="opacity-0 max-w-0 max-h-0 my-0 py-0"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('avatar')?.click()}
              >
                파일 선택
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline" className="font-semibold">한 줄 소개</Label>
          <Input
            id="tagline"
            type="text"
            value={currentTagline || ""}
            onChange={(e) => setCurrentTagline(e.target.value)}
            maxLength={30} // Enforce 30 character limit
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio" className="font-semibold">자유 소개</Label>
          <Textarea
            id="bio"
            value={currentBio || ""}
            onChange={(e) => setCurrentBio(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link" className="font-semibold">Link</Label>
          <Input
            id="link"
            type="text"
            value={currentLink || ""}
            onChange={handleLinkChange} // Use new handler
            className={!isLinkValid ? "border-red-500" : ""} // Add error styling
          />
          {!isLinkValid && (
            <p className="text-red-500 text-sm mt-1">
              유효한 URL을 입력해주세요.
            </p>
          )}
        </div>
        <div className="pt-4">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending || !isLinkValid}
          >
            {updateProfileMutation.isPending ? "수정 중..." : "수정하기"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
