'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import Image from 'next/image';

interface ProfileFormProps {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  link: string | null;
}

export default function ProfileForm({ userId, username, fullName, avatarUrl, bio, link }: ProfileFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(username);
  const [currentFullName, setCurrentFullName] = useState<string | null>(fullName);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl);
  const [currentBio, setCurrentBio] = useState<string | null>(bio);
  const [currentLink, setCurrentLink] = useState<string | null>(link);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(avatarUrl);

  useEffect(() => {
    setCurrentUsername(username);
    setCurrentFullName(fullName);
    setCurrentBio(bio);
    setCurrentLink(link);
    setCurrentAvatarUrl(avatarUrl);
    setAvatarPreviewUrl(avatarUrl);
    setLoading(false);
  }, [username, fullName, avatarUrl, bio, link]);

  const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
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
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            }
          }, file.type, quality);
        };
      };
    });
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${userId}/${fileName}`; // Store in a user-specific folder

    // Resize image before upload
    const resizedBlob = await resizeImage(file, 300, 300, 0.7); // Max 300x300, 70% quality
    const resizedFile = new File([resizedBlob], fileName, { type: file.type });

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, resizedFile, {
        cacheControl: '3600',
        upsert: true, // Overwrite existing file
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const updateProfile = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    let newAvatarUrl = currentAvatarUrl;
    if (avatarFile) {
      try {
        newAvatarUrl = await uploadAvatar(avatarFile);
      } catch (error: any) {
        alert(`Error uploading avatar: ${error.message}`);
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: currentUsername,
        full_name: currentFullName,
        avatar_url: newAvatarUrl,
        bio: currentBio,
        link: currentLink,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
      setCurrentAvatarUrl(newAvatarUrl); // Update state with new URL
      setAvatarFile(null); // Clear file input
    }
    setLoading(false);
  }, [userId, currentUsername, currentFullName, currentBio, currentLink, avatarFile, currentAvatarUrl, supabase]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your public profile details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <Label htmlFor="email">User ID</Label>
            <Input id="email" type="text" value={userId} disabled />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={currentUsername || ''}
              onChange={(e) => setCurrentUsername(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={currentFullName || ''}
              onChange={(e) => setCurrentFullName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="avatar">Avatar</Label>
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
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={currentBio || ''}
              onChange={(e) => setCurrentBio(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              type="text"
              value={currentLink || ''}
              onChange={(e) => setCurrentLink(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
