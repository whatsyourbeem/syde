'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface ProfileFormProps {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export default function ProfileForm({ userId, username, fullName, avatarUrl }: ProfileFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(username);
  const [currentFullName, setCurrentFullName] = useState<string | null>(fullName);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl);

  useEffect(() => {
    setCurrentUsername(username);
    setCurrentFullName(fullName);
    setCurrentAvatarUrl(avatarUrl);
    setLoading(false); // Set loading to false once initial data is set
  }, [username, fullName, avatarUrl]);

  const updateProfile = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: currentUsername,
        full_name: currentFullName,
        avatar_url: currentAvatarUrl,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
      // Optionally revalidate path or redirect
      // For now, just alert and let the user see the updated state
    }
    setLoading(false);
  }, [userId, currentUsername, currentFullName, currentAvatarUrl, supabase]);

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
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="text"
              value={currentAvatarUrl || ''}
              onChange={(e) => setCurrentAvatarUrl(e.target.value)}
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
