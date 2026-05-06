import { createClient } from "@/lib/supabase/server";
import { FeedEditDialog } from "@/components/feed/feed-edit-dialog";
import { LoginPromptCard } from "@/components/auth/login-prompt-card";

export async function FeedSidebarServer() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let profile = null;
    let avatarUrl = null;
    if (user) {
        const { data, error: profileError } = await supabase
            .from("profiles")
            .select("*, updated_at")
            .eq("id", user.id)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile for FeedServerSidebar:", profileError);
        } else if (data) {
            profile = data;
            avatarUrl =
                profile.avatar_url && profile.updated_at
                    ? `${profile.avatar_url}?t=${new Date(
                        profile.updated_at
                    ).getTime()}`
                    : profile.avatar_url;
        }
    }

    if (user && profile) {
        return (
            <FeedEditDialog
                userId={user.id}
                avatarUrl={avatarUrl}
                username={profile.username}
                full_name={profile.full_name}
                certified={profile.certified}
            />
        );
    }

    return <LoginPromptCard />;
}

export function FeedSidebarSkeleton() {
    return (
        <div className="w-full h-40 bg-gray-100 rounded-xl animate-pulse">
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}
