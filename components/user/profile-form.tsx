"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Plus } from "lucide-react";
import { updateProfile, checkUsername } from "@/app/[username]/actions"; // Import the server action
import { useFormStatus } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { deleteAccount } from "@/app/auth/auth-actions";
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

interface ProfileFormProps {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  link: string | null;
  tagline: string | null;
  className?: string;
}

function SubmitButton({
  isLinkValid,
  isUsernameValid,
  isFullNameValid,
  isUsernameLengthValid,
  isUsernameAvailable,
}: {
  isLinkValid: boolean;
  isUsernameValid: boolean;
  isFullNameValid: boolean;
  isUsernameLengthValid: boolean;
  isUsernameAvailable: boolean | null;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={
        pending ||
        !isLinkValid ||
        !isUsernameValid ||
        !isFullNameValid ||
        !isUsernameLengthValid ||
        isUsernameAvailable === false
      }
    >
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
  const router = useRouter();
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
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isFullNameValid, setIsFullNameValid] = useState(true);
  const [isUsernameLengthValid, setIsUsernameLengthValid] = useState(true);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

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

  const validateUsername = (username: string | null): boolean => {
    if (!username) return true; // Allow empty for now, or add required validation later
    const regex = /^[a-zA-Z0-9_-]*$/;
    return regex.test(username);
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

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentUsername(value);

    const isLengthValid = value.length <= 20;
    const isPatternValid = validateUsername(value);

    setIsUsernameLengthValid(isLengthValid);
    setIsUsernameValid(isPatternValid);
    setIsUsernameAvailable(null); // Reset availability on change
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentFullName(value);
    setIsFullNameValid(value.length <= 20);
  };

  const handleCancel = () => {
    router.back();
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
      const fileName = `${uuidv4()}.${fileExt}`; // Use UUID for unique file name
      const filePath = `${userId}/avatar/${fileName}`; // New path structure

      // Resize image before upload
      const resizedBlob = await resizeImage(file, 300, 300, 0.7); // Max 300x300, 70% quality
      const resizedFile = new File([resizedBlob], fileName, {
        type: file.type,
      });

      const { error: uploadError } = await supabase.storage
        .from("profiles") // Use the 'profiles' bucket
        .upload(filePath, resizedFile, {
          cacheControl: "3600",
          upsert: false, // No need for upsert with UUID
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = await supabase.storage
        .from("profiles") // Use the 'profiles' bucket
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
    // Check username availability only when submitting
    if (currentUsername !== username) {
      setIsCheckingUsername(true);
      const isAvailable = await checkUsername(currentUsername || "", userId);
      setIsUsernameAvailable(isAvailable);
      setIsCheckingUsername(false);

      if (!isAvailable) {
        return; // Stop form submission if username is not available
      }
    }

    let newAvatarUrl = currentAvatarUrl;
    if (avatarFile) {
      try {
        newAvatarUrl = await uploadAvatar(avatarFile);
      } catch (error: unknown) {
        alert(
          `아바타 업로드 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`
        );
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
    <Card className={`w-full border-0 shadow-none ${className || ""}`}>
      <form action={clientAction} className="space-y-8 pt-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="font-semibold">
            닉네임
          </Label>
          <Input
            id="fullName"
            name="full_name"
            type="text"
            value={currentFullName || ""}
            onChange={handleFullNameChange}
            className={!isFullNameValid ? "border-red-500" : ""}
          />
          {!isFullNameValid && (
            <p className="text-red-500 text-sm mt-1">
              닉네임의 최대 길이는 20자입니다. ({currentFullName?.length || 0}
              /20)
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="username" className="font-semibold">
            프로필 네임
          </Label>
          <Input
            id="username"
            name="username"
            type="text"
            value={currentUsername || ""}
            onChange={handleUsernameChange}
            className={
              !isUsernameValid ||
              !isUsernameLengthValid ||
              isUsernameAvailable === false
                ? "border-red-500"
                : ""
            }
          />
          <p className="text-sm text-muted-foreground">
            프로필 네임은 프로필 페이지 링크와 연동돼요.
          </p>
          {!isUsernameValid && (
            <p className="text-red-500 text-sm mt-1">
              프로필 네임은 알파벳, 숫자, _ , - 만 사용할 수 있습니다.
            </p>
          )}
          {!isUsernameLengthValid && (
            <p className="text-red-500 text-sm mt-1">
              프로필 네임의 최대 길이는 20자입니다. ({
                currentUsername?.length || 0
              }
              /20)
            </p>
          )}
          {isCheckingUsername && (
            <p className="text-sm text-muted-foreground mt-1">
              확인 중...
            </p>
          )}
          {isUsernameAvailable === false && (
            <p className="text-red-500 text-sm mt-1">
              이미 사용중인 프로필 네임입니다.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => document.getElementById("avatar")?.click()}
            >
              {avatarPreviewUrl && (
                <Image
                  src={avatarPreviewUrl}
                  alt="Avatar"
                  className={`rounded-full object-cover aspect-square w-full h-full transition-opacity duration-300 ${
                    isHovered ? "opacity-50" : "opacity-100"
                  }`}
                  width={96}
                  height={96}
                />
              )}
              <div
                className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300 z-10 ${
                  isHovered ? "opacity-30" : "opacity-0"
                }`}
              >
                <Plus className="w-12 h-12" color="white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold pl-1">프로필 사진</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="opacity-0 max-w-0 max-h-0 my-0 py-0"
              />
              <Button
                type="button"
                onClick={() => document.getElementById("avatar")?.click()}
              >
                파일 선택
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline" className="font-semibold">
            한 줄 소개
          </Label>
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
          <Label htmlFor="link" className="font-semibold">
            Link
          </Label>
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
        <div className="pt-4 flex space-x-2">
          <div className="flex space-x-2">
            <SubmitButton
              isLinkValid={isLinkValid}
              isUsernameValid={isUsernameValid}
              isFullNameValid={isFullNameValid}
              isUsernameLengthValid={isUsernameLengthValid}
              isUsernameAvailable={isUsernameAvailable}
            />
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
          </div>
          <div className="flex-grow" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-gray-500">
                회원 탈퇴
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 회원 탈퇴하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며, 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <form action={async () => { await deleteAccount(); }}>
                  <AlertDialogAction asChild>
                    <Button type="submit" variant="destructive">
                      탈퇴
                    </Button>
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Card>
  );
}
