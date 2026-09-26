import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/user/profile-form";
import { UserActivityLogList } from "@/components/user/user-activity-log-list";
import { LogoutButton } from "@/components/auth/logout-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  let username = null;
  let fullName = null;
  let avatarUrl = null;
  let link = null;
  let tagline = null;
  let tags: string[] | null = null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, link, tagline, tags, updated_at')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileError);
  } else if (profile) {
    username = profile.username;
    fullName = profile.full_name;
    link = profile.link;
    tagline = profile.tagline;
    tags = profile.tags;
    avatarUrl = profile.avatar_url
      ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ''}`
      : null;
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full max-w-[850px] mx-auto flex flex-col">
        {/* Title Section */}
        <div className="flex flex-col justify-center items-start p-5 gap-4 border-b-[0.5px] border-[#B7B7B7] w-full">
          <div className="flex flex-row items-center gap-4">
            <Link
              href={username ? `/@${username}` : "/"}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[#434343]" />
            </Link>
            <div className="flex flex-col justify-center items-start py-2 gap-2">
              <h1 className="text-2xl font-bold text-sydeblue">
                프로필 관리
              </h1>
              <p className="text-sm text-[#777777]">
                프로필로 당신의 SYDE를 표현해주세요.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b-[0.5px] border-[#B7B7B7] rounded-none px-5 md:px-8 h-auto gap-4">
            <TabsTrigger
              value="edit"
              className="px-2 py-3 rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-sydeblue data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent"
            >
              프로필 편집
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="px-2 py-3 rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-sydeblue data-[state=active]:shadow-none bg-transparent data-[state=active]:bg-transparent"
            >
              내 기록 🔒
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-0">
            <div className="w-full flex flex-col items-center py-5">
              <div className="w-full max-w-[600px] px-5 sm:px-15 md:px-20 lg:px-[60px] flex flex-col gap-6">
                <ProfileForm
                  userId={user.id}
                  username={username}
                  fullName={fullName}
                  avatarUrl={avatarUrl}
                  link={link}
                  tagline={tagline}
                  tags={tags}
                />
                <div className="flex justify-center">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0 px-5 py-5 md:px-8">
            <UserActivityLogList currentUserId={user.id} userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
