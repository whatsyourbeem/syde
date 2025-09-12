import { createClient } from "@/lib/supabase/server";
import { getCachedProfile } from "@/lib/cache/log-cache";
import { LogListServer } from "@/components/log/log-list-server";
import { LogCreateButton } from "@/components/log/log-create-button";
import { Suspense } from "react";

export const revalidate = 30;

async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, avatarUrl: null };

  const profileData = await getCachedProfile(user.id);
  
  let profile = null;
  let avatarUrl = null;
  
  if (profileData) {
    profile = profileData;
    avatarUrl =
      profile.avatar_url && profile.updated_at
        ? `${profile.avatar_url}?t=${new Date(
            profile.updated_at
          ).getTime()}`
        : profile.avatar_url;
  }

  return { user, profile, avatarUrl };
}

export default async function LogPage() {
  const { user, profile, avatarUrl } = await getUserProfile();

  return (
    <div>
      <Suspense fallback={
        <div className="mb-6 p-4 border border-gray-200 rounded-lg animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded-md w-24" />
          </div>
          <div className="h-20 bg-gray-200 rounded-md w-full mb-3" />
          <div className="h-8 bg-gray-200 rounded-md w-16" />
        </div>
      }>
        {user && profile && (
          <LogCreateButton user={profile} avatarUrl={avatarUrl} />
        )}
      </Suspense>
      
      <Suspense fallback={<div>Loading logs...</div>}>
        <LogListServer currentUserId={user?.id || null} />
      </Suspense>
    </div>
  );
}