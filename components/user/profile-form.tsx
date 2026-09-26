"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Plus, Mail, Github, Twitter, Instagram, Globe } from "lucide-react";
import { updateProfile, checkUsername } from "@/app/[username]/actions"; // Import the server action
import { useFormStatus } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { deleteAccount } from "@/app/auth/auth-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  tags: string[] | null;
  contactEmail: string | null;
  githubUsername: string | null;
  twitterUsername: string | null;
  instagramUsername: string | null;
  className?: string;
}

const MAX_TAGS = 3;
const MAX_TAG_LENGTH = 12;

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
      className="flex-grow bg-sydeblue hover:bg-sydeblue/90 text-white rounded-xl h-10 font-bold"
      disabled={
        pending ||
        !isLinkValid ||
        !isUsernameValid ||
        !isFullNameValid ||
        !isUsernameLengthValid ||
        isUsernameAvailable === false
      }
    >
      {pending ? "저장 중..." : "정보 저장"}
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
  tags,
  contactEmail,
  githubUsername,
  twitterUsername,
  instagramUsername,
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
  const [currentTags, setCurrentTags] = useState<string[]>(tags || []);
  const [tagInput, setTagInput] = useState("");
  const [currentContactEmail, setCurrentContactEmail] = useState<string | null>(contactEmail);
  const [currentGithubUsername, setCurrentGithubUsername] = useState<string | null>(githubUsername);
  const [currentTwitterUsername, setCurrentTwitterUsername] = useState<string | null>(twitterUsername);
  const [currentInstagramUsername, setCurrentInstagramUsername] = useState<string | null>(instagramUsername);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    avatarUrl
  );
  const [isLinkValid, setIsLinkValid] = useState(true);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [isFullNameValid, setIsFullNameValid] = useState(true);
  const [isUsernameLengthValid, setIsUsernameLengthValid] = useState(true);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  useEffect(() => {
    setCurrentUsername(username);
    setCurrentFullName(fullName);
    setCurrentLink(link);
    setCurrentTagline(tagline);
    setCurrentTags(tags || []);
    setCurrentContactEmail(contactEmail);
    setCurrentGithubUsername(githubUsername);
    setCurrentTwitterUsername(twitterUsername);
    setCurrentInstagramUsername(instagramUsername);
    setCurrentAvatarUrl(avatarUrl);
    setAvatarPreviewUrl(avatarUrl);
    if (link) {
      setIsLinkValid(isValidUrl(link));
    }
  }, [username, fullName, avatarUrl, link, tagline, tags, contactEmail, githubUsername, twitterUsername, instagramUsername]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateUsername = (username: string | null): boolean => {
    if (!username) return true;
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
    setIsUsernameAvailable(null);
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentFullName(value);
    setIsFullNameValid(value.length <= 20);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAddTag = () => {
    const value = tagInput.replace(/^#/, "").trim();
    if (!value) return;
    if (value.length > MAX_TAG_LENGTH) {
      toast.error(`태그는 ${MAX_TAG_LENGTH}자 이내로 입력해주세요.`);
      return;
    }
    if (currentTags.includes(value)) {
      setTagInput("");
      return;
    }
    if (currentTags.length >= MAX_TAGS) {
      toast.error(`태그는 최대 ${MAX_TAGS}개까지 추가할 수 있어요.`);
      return;
    }
    setCurrentTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentTags((prev) => prev.filter((t) => t !== tag));
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
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/avatar/${fileName}`;

      const resizedBlob = await resizeImage(file, 300, 300, 0.7);
      const resizedFile = new File([resizedBlob], fileName, {
        type: file.type,
      });

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, resizedFile, {
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = await supabase.storage
        .from("profiles")
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
    if (currentUsername !== username) {
      setIsCheckingUsername(true);
      const isAvailable = await checkUsername(currentUsername || "", userId);
      setIsUsernameAvailable(isAvailable);
      setIsCheckingUsername(false);

      if (!isAvailable) {
        return;
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

    formData.append("avatar_url", newAvatarUrl || "");
    formData.append("full_name", currentFullName || "");
    formData.append("tagline", currentTagline || "");
    formData.append("link", currentLink || "");
    formData.append("username", currentUsername || "");
    formData.append("tags", JSON.stringify(currentTags));
    formData.append("contact_email", currentContactEmail || "");
    formData.append("github_username", currentGithubUsername || "");
    formData.append("twitter_username", currentTwitterUsername || "");
    formData.append("instagram_username", currentInstagramUsername || "");

    await updateProfile(formData);
  };

  const inputClass = "h-9 border-[0.5px] border-[#B7B7B7] rounded-[10px] text-sm focus:border-sydeblue transition-colors";
  const labelClass = "text-sm font-medium text-sydeblue";

  return (
    <Card className={`w-full border-0 shadow-none bg-transparent ${className || ""}`}>
      <form action={clientAction} className="space-y-5">
        {/* Nickname */}
        <div className="space-y-1">
          <Label htmlFor="fullName" className={labelClass}>
            닉네임 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            name="full_name"
            type="text"
            placeholder="커뮤니티에서 사용할 이름이에요."
            value={currentFullName || ""}
            onChange={handleFullNameChange}
            className={cn(inputClass, !isFullNameValid && "border-red-500")}
          />
          {!isFullNameValid && (
            <p className="text-red-500 text-[11px] mt-1">
              닉네임의 최대 길이는 20자입니다.
            </p>
          )}
        </div>

        {/* Username */}
        <div className="space-y-1">
          <Label htmlFor="username" className={labelClass}>
            프로필 네임 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777] text-sm">@</span>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="URL 주소에 쓰이는 고유 이름이에요."
              value={currentUsername || ""}
              onChange={handleUsernameChange}
              className={cn(inputClass, "pl-7", (!isUsernameValid || !isUsernameLengthValid || isUsernameAvailable === false) && "border-red-500")}
            />
          </div>
          {!isUsernameValid && (
            <p className="text-red-500 text-[11px] mt-1">
              영문, 숫자, _, - 만 사용할 수 있습니다.
            </p>
          )}
          {isUsernameAvailable === false && (
            <p className="text-red-500 text-[11px] mt-1">
              이미 사용 중인 프로필 네임입니다.
            </p>
          )}
        </div>

        {/* Profile Image Section */}
        <div className="flex items-center gap-10 py-2">
          <div 
            className="relative w-[180px] h-[180px] rounded-full overflow-hidden bg-sydeblue flex items-center justify-center cursor-pointer group"
            onClick={() => document.getElementById("avatar")?.click()}
          >
            {avatarPreviewUrl ? (
              <Image
                src={avatarPreviewUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="relative w-20 h-20">
                <Image
                  src="/logo_no_bg_light.png"
                  alt="SYDE Logo"
                  fill
                  className="object-contain opacity-80"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Plus className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label className={labelClass}>프로필 이미지</Label>
              <p className="text-xs text-[#777777] leading-tight font-normal">
                프로필 대표 <br /> 이미지를 설정해주세요.
              </p>
            </div>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="default"
              className="w-20 bg-sydeblue hover:bg-sydeblue/90 text-white text-xs h-8 rounded-xl font-normal"
              onClick={() => document.getElementById("avatar")?.click()}
            >
              사진 선택
            </Button>
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-1">
          <Label htmlFor="tagline" className={labelClass}>
            한 줄 소개
          </Label>
          <Input
            id="tagline"
            name="tagline"
            type="text"
            placeholder="나를 표현하는 한 줄!"
            value={currentTagline || ""}
            onChange={(e) => setCurrentTagline(e.target.value)}
            className={inputClass}
            maxLength={30}
          />
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <Label htmlFor="tagInput" className={labelClass}>
            관심사/역할 태그 ({currentTags.length}/{MAX_TAGS})
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {currentTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAFAFA] border border-[#B7B7B7] rounded-full text-xs font-medium text-[#777777]"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[#B7B7B7] hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="tagInput"
              type="text"
              placeholder="예: 백엔드, Next.js, N잡러"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className={inputClass}
              disabled={currentTags.length >= MAX_TAGS}
              maxLength={MAX_TAG_LENGTH}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-[#B7B7B7] text-sydeblue rounded-xl h-9"
              onClick={handleAddTag}
              disabled={currentTags.length >= MAX_TAGS}
            >
              추가
            </Button>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <Label className={labelClass}>소셜 정보</Label>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
            <Input
              id="contactEmail"
              name="contact_email"
              type="email"
              placeholder="이메일을 입력하세요."
              value={currentContactEmail || ""}
              onChange={(e) => setCurrentContactEmail(e.target.value)}
              className={cn(inputClass, "pl-9")}
            />
          </div>

          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
            <Input
              id="githubUsername"
              name="github_username"
              type="text"
              placeholder="Github 계정을 입력하세요."
              value={currentGithubUsername || ""}
              onChange={(e) => setCurrentGithubUsername(e.target.value)}
              className={cn(inputClass, "pl-9")}
            />
          </div>

          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
            <Input
              id="twitterUsername"
              name="twitter_username"
              type="text"
              placeholder="Twitter 계정을 입력하세요."
              value={currentTwitterUsername || ""}
              onChange={(e) => setCurrentTwitterUsername(e.target.value)}
              className={cn(inputClass, "pl-9")}
            />
          </div>

          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
            <Input
              id="instagramUsername"
              name="instagram_username"
              type="text"
              placeholder="Instagram 계정을 입력하세요."
              value={currentInstagramUsername || ""}
              onChange={(e) => setCurrentInstagramUsername(e.target.value)}
              className={cn(inputClass, "pl-9")}
            />
          </div>

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
            <Input
              id="link"
              name="link"
              type="text"
              placeholder="홈페이지 주소를 입력하세요."
              value={currentLink || ""}
              onChange={handleLinkChange}
              className={cn(inputClass, "pl-9", !isLinkValid && "border-red-500")}
            />
          </div>
          {!isLinkValid && (
            <p className="text-red-500 text-[11px]">
              유효한 URL을 입력해주세요.
            </p>
          )}

          <p className="text-[11px] text-[#777777]">
            프로필 명함에 공개되는 소셜 정보입니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-20 border-[#B7B7B7] text-sydeblue rounded-xl h-10 font-normal"
            onClick={handleCancel}
          >
            취소
          </Button>
          <SubmitButton
            isLinkValid={isLinkValid}
            isUsernameValid={isUsernameValid}
            isFullNameValid={isFullNameValid}
            isUsernameLengthValid={isUsernameLengthValid}
            isUsernameAvailable={isUsernameAvailable}
          />
        </div>

        {/* Delete Account (Optional, small link at bottom) */}
        <div className="flex justify-center pt-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="text-[11px] text-[#B7B7B7] hover:underline">
                회원 탈퇴
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sydeblue">정말 회원 탈퇴하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-500 text-sm">
                  회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며, 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl border-[#B7B7B7]">취소</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    disabled={isDeletingAccount}
                    onClick={async (event) => {
                      // Keep the dialog open until we know the result — Radix
                      // closes it on click by default, which would otherwise
                      // hide a failure behind a dialog that's already gone.
                      event.preventDefault();
                      if (isDeletingAccount) return;
                      setIsDeletingAccount(true);
                      try {
                        // deleteAccount() requires an authenticated request server-side,
                        // so we can't sign out client-side first — it has to run after,
                        // and deleteAccount() no longer redirects so this code is
                        // guaranteed to run once it resolves.
                        const result = await deleteAccount();
                        if (result.success) {
                          await supabase.auth.signOut({ scope: "local" });
                          window.location.assign("/");
                          return;
                        }
                        toast.error(result.error.message || "탈퇴 처리 중 오류가 발생했습니다.");
                      } catch (error) {
                        console.error("Error deleting account:", error);
                        toast.error("탈퇴 처리 중 오류가 발생했습니다.");
                      } finally {
                        setIsDeletingAccount(false);
                      }
                    }}
                  >
                    {isDeletingAccount ? "탈퇴 처리 중..." : "탈퇴"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Card>
  );
}
