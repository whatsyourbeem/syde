"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface LogFormProps {
  userId: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
  username: string | null;
}

export function LogForm({
  userId,
  userEmail,
  avatarUrl,
  username,
}: LogFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
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

  const uploadImage = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const resizedBlob = await resizeImage(file, 800, 800, 0.8); // Max 800x800, 80% quality
    const resizedFile = new File([resizedBlob], fileName, { type: file.type });

    const { error: uploadError } = await supabase.storage
      .from("logimages") // Changed to logimages
      .upload(filePath, resizedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("logimages")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setLoading(true);
      let imageUrl: string | null = null;

      try {
        if (imageFile) {
          imageUrl = await uploadImage(imageFile, userId);
        }

        const { error } = await supabase.from("logs").insert({
          // Changed to logs
          user_id: userId,
          content: content,
          image_url: imageUrl,
        });

        if (error) {
          throw error;
        }

        setContent("");
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear the file input
        }
      } catch (error: any) {
        alert(`Error logging: ${error.message}`); // Changed alert message
      } finally {
        setLoading(false);
      }
    },
    [userId, content, imageFile, router, supabase]
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg shadow-sm bg-card">
      {!userId ? (
        <div className="text-center">
          <p className="mb-4">로그인하여 새로운 글을 작성하세요.</p>
          <Button onClick={() => router.push("/auth/login")}>로그인</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold">{username || userEmail}</p>
            </div>
          </div>
          <Textarea
            placeholder="무슨 생각을 하고 계신가요?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            disabled={loading}
          />
          {imagePreviewUrl && (
            <div className="relative w-full h-48 rounded-md overflow-hidden">
              <Image
                src={imagePreviewUrl}
                alt="Image preview"
                layout="fill"
                objectFit="cover"
              />
            </div>
          )}
          <div className="flex justify-between items-center">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-auto"
              disabled={loading}
              ref={fileInputRef} // Attach ref to the Input component
            />
            <Button type="submit" disabled={loading || content.trim() === ""}>
              {loading ? "로그 기록 중..." : "로그 기록하기"}{" "}
              {/* Changed button text */}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
