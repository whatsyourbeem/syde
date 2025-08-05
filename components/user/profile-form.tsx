"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Plus } from "lucide-react";
import { updateProfile } from "@/app/[username]/actions"; // Import the server action
import { useFormStatus } from "react-dom";

interface ProfileFormProps {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  link: string | null;
  tagline: string | null;
  className?: string;
}

function SubmitButton({ isLinkValid }: { isLinkValid: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || !isLinkValid}>
      {pending ? "수정 중..." : "수정하기"}
    </Button>
  );
}

export default function ProfileForm({
  userId,
  username,
  fullName,
  avatarUrl,
  link,
  tagline,
  className,
}: ProfileFormProps) {
  const supabase = createClient();
  const [currentUsername, setCurrentUsername] = useState<string | null>(
    username
  );
  const [currentFullName, setCurrentFullName] = useState<string | null>(
    fullName
  );
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    avatarUrl
  );
  const [currentLink, setCurrentLink] = useState<string | null>(link);
  const [currentTagline, setCurrentTagline] = useState<string | null>(tagline);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    avatarUrl
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isLinkValid, setIsLinkValid] = useState(true);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  useEffect(() => {
    setCurrentUsername(username);
    setCurrentFullName(fullName);
    setCurrentLink(link);
    setCurrentTagline(tagline);
    setCurrentAvatarUrl(avatarUrl);
    setAvatarPreviewUrl(avatarUrl);
    if (link) {
      setIsLinkValid(isValidUrl(link));
    }
  }, [username, fullName, avatarUrl, link, tagline]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentLink(value);
    if (value === "") {
      setIsLinkValid(true);
    } else {
      setIsLinkValid(isValidUrl(value));
    }
  };

  const resizeImage = useCallback(
    (
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
    },
    []
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
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
    },
    [userId, resizeImage, supabase]
  );

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clientAction = async (formData: FormData) => {
    let newAvatarUrl = currentAvatarUrl;
    if (avatarFile) {
      try {
        newAvatarUrl = await uploadAvatar(avatarFile);
      } catch (error: unknown) {
        alert(`아바타 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        return;
      }
    }

    // Append avatar_url to formData
    formData.append("avatar_url", newAvatarUrl || "");
    formData.append("full_name", currentFullName || "");
    formData.append("tagline", currentTagline || "");
    formData.append("link", currentLink || "");
    formData.append("username", currentUsername || "");


    await updateProfile(formData);
  };

  return (
    <Card className={`w-full border-0 shadow-none ${className || ''}`}>
      <form action={clientAction} className="space-y-8 pt-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="font-semibold">닉네임</Label>
          <Input
            id="fullName"
            name="full_name"
            type="text"
            value={currentFullName || ""}
            onChange={(e) => setCurrentFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username" className="font-semibold">프로필 네임</Label>
          <Input
            id="username"
            name="username"
            type="text"
            value={currentUsername || ""}
            onChange={(e) => setCurrentUsername(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">프로필 네임은 프로필 페이지 링크와 연동돼요.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => document.getElementById('avatar')?.click()}
            >
              {avatarPreviewUrl && (
                <Image
                  src={avatarPreviewUrl}
                  alt="Avatar"
                  className={`rounded-full object-cover w-full h-full transition-opacity duration-300 ${isHovered ? "opacity-50" : "opacity-100"}`}
                  width={96}
                  height={96}
                />
              )}
              <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300 z-10 ${isHovered ? "opacity-30" : "opacity-0"}`}>
                <Plus className="w-12 h-12" color="white"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold pl-1">프로필 사진</Label>
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
            name="tagline"
            type="text"
            value={currentTagline || ""}
            onChange={(e) => setCurrentTagline(e.target.value)}
            maxLength={30}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link" className="font-semibold">Link</Label>
          <Input
            id="link"
            name="link"
            type="text"
            value={currentLink || ""}
            onChange={handleLinkChange}
            className={!isLinkValid ? "border-red-500" : ""}
          />
          {!isLinkValid && (
            <p className="text-red-500 text-sm mt-1">
              유효한 URL을 입력해주세요.
            </p>
          )}
        </div>
        <div className="pt-4">
          <SubmitButton isLinkValid={isLinkValid} />
        </div>
      </form>
    </Card>
  );
}
