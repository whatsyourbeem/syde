"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getProfileById } from "@/lib/queries/profile-queries";
import { getUnreadNotificationsCount } from "@/lib/queries/notification-queries";
import { PublicProfile } from "@/types/profile";
import { Tables } from "@/types/database.types";

interface AuthContextType {
  user: User | null;
  profile: PublicProfile | null;
  avatarUrl: string | null;
  unreadNotificationCount: number;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  markAllNotificationsRead: () => void;
  markOneNotificationRead: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function computeAvatarUrl(profile: PublicProfile | null): string | null {
  if (!profile?.avatar_url) return null;
  return profile.updated_at
    ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}`
    : profile.avatar_url;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const userId = user?.id ?? null;

  // Subscribing fires an INITIAL_SESSION event right away, so this alone seeds the
  // initial state — no separate getSession() call needed here. Never await another
  // Supabase call inside this callback (Supabase's own docs warn it can deadlock);
  // profile/notification fetching live in their own effects below, keyed on user id.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsSessionLoading(false);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setIsProfileLoading(true);
    getProfileById(supabase, userId).then((data) => {
      if (cancelled) return;
      setProfile(data);
      setIsProfileLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Owned here (not in NotificationBell) so the count/subscription exist exactly
  // once even though NotificationBell itself is mounted twice (mobile + desktop
  // header blocks, hidden via responsive CSS, not conditionally rendered).
  useEffect(() => {
    if (!userId) {
      setUnreadNotificationCount(0);
      return;
    }
    let cancelled = false;
    getUnreadNotificationsCount(supabase, userId).then((count) => {
      if (!cancelled) setUnreadNotificationCount(count);
    });

    const channel = supabase
      .channel(`realtime-notifications-${userId}`)
      .on<Tables<"notifications">>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => setUnreadNotificationCount((prev) => prev + 1)
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Safety net for auth/profile changes made through a Server Action + redirect()
  // (logout, delete account, profile edits, the dev test-login fallback) — redirect()
  // navigates client-side without a reload, so onAuthStateChange never fires for it.
  // Session and profile are compared independently: a profile edit doesn't change
  // user.id, so gating the profile refetch on the session comparison would miss it.
  const lastSyncedPathname = useRef(pathname);
  useEffect(() => {
    if (lastSyncedPathname.current === pathname) return;
    lastSyncedPathname.current = pathname;

    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      const nextUser = session?.user ?? null;
      setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));

      if (nextUser) {
        const freshProfile = await getProfileById(supabase, nextUser.id);
        if (cancelled) return;
        setProfile((prev) => (prev?.updated_at === freshProfile?.updated_at ? prev : freshProfile));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const refreshProfile = async () => {
    if (!userId) return;
    const freshProfile = await getProfileById(supabase, userId);
    setProfile(freshProfile);
  };

  const markAllNotificationsRead = () => setUnreadNotificationCount(0);
  const markOneNotificationRead = () => setUnreadNotificationCount((prev) => Math.max(0, prev - 1));

  const avatarUrl = useMemo(() => computeAvatarUrl(profile), [profile]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      avatarUrl,
      unreadNotificationCount,
      isLoading: isSessionLoading || (!!userId && isProfileLoading),
      refreshProfile,
      markAllNotificationsRead,
      markOneNotificationRead,
    }),
    // refreshProfile/markAllNotificationsRead/markOneNotificationRead close over
    // stable values (userId, setState) so they're intentionally left out here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, avatarUrl, unreadNotificationCount, isSessionLoading, isProfileLoading, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
