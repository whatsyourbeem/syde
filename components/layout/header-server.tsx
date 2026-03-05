import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import NotificationBell from "@/components/notification/notification-bell";
import { AuthButton } from "@/components/auth/auth-button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { createClient } from "@/lib/supabase/server";

// Using local fonts loaded from layout.tsx
// Since we can't easily import the localFont instance instantiated in layout.tsx,
// we just pass the className string or assume it inherits via cascade for the logo.
// But the logo used paperlogy.className. We can import it if we extract it, but for now
// we can just use the global CSS fallback or pass it as prop if needed.
// Actually, it's safer to extract the Header completely.

export async function HeaderServer({ paperlogyClassName }: { paperlogyClassName: string }) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    let avatarUrl = null;
    let usernameForAuthButton = null;
    let fullNameForAuthButton = null;
    let unreadNotifCount = 0;

    if (user) {
        const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("recipient_user_id", user.id)
            .eq("is_read", false);
        unreadNotifCount = count ?? 0;

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("avatar_url, updated_at, username, full_name")
            .eq("id", user.id)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile for layout:", profileError);
        } else if (profile) {
            avatarUrl = profile.avatar_url
                ? `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : ""
                }`
                : null;
            usernameForAuthButton =
                profile.username || user.email?.split("@")[0] || null;
            fullNameForAuthButton = profile.full_name || usernameForAuthButton;
        }
    }

    return (
        <header>
            <div className="w-full bg-background">
                <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-5 pt-3 pb-2 text-sm">
                    {/* Mobile specific layout */}
                    <div className="flex md:hidden w-full justify-between items-center">
                        <div className="flex items-center">
                            <Link href={"/"} className="flex items-center gap-1">
                                <Image
                                    src="/logo_no_bg.png"
                                    alt="SYDE"
                                    width={36}
                                    height={36}
                                    priority
                                />
                                <span
                                    className={`text-2xl font-extrabold text-sydenightblue ${paperlogyClassName}`}
                                >
                                    <span style={{ letterSpacing: "0.01em" }}>S</span>
                                    <span style={{ letterSpacing: "0.01em" }}>Y</span>
                                    <span style={{ letterSpacing: "0em" }}>DE</span>
                                </span>
                            </Link>
                        </div>
                        <div className="flex justify-end items-center gap-4">
                            <Link
                                href="/search"
                                className="text-foreground hover:text-primary p-2 rounded-full hover:bg-secondary"
                            >
                                <Search size={20} />
                            </Link>
                            <Suspense
                                fallback={<div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />}
                            >
                                <NotificationBell
                                    initialUnreadCount={unreadNotifCount}
                                    userId={user?.id || null}
                                />
                            </Suspense>
                            <MobileMenu
                                user={user}
                                authButton={
                                    <AuthButton
                                        avatarUrl={avatarUrl}
                                        username={usernameForAuthButton}
                                        fullName={fullNameForAuthButton}
                                        sheetHeader={true}
                                    />
                                }
                            />
                        </div>
                    </div>

                    {/* Desktop specific layout */}
                    <div className="hidden md:flex w-full justify-between items-center">
                        <div className="w-1/3">
                            <Link
                                href="https://open.kakao.com/o/gduSGmtf"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 hover:bg-[#FEE500]/20 px-2 md:px-4"
                                >
                                    <Image
                                        src="/kakao-talk-bw.png"
                                        alt="Kakao"
                                        width={24}
                                        height={24}
                                    />
                                    <span className="hidden md:inline text-[#4B4737]">
                                        SYDE 오픈채팅
                                    </span>
                                </Button>
                            </Link>
                        </div>
                        <div className="w-1/3 flex justify-center items-center font-semibold">
                            <Link href={"/"} className="flex items-center gap-1">
                                <Image
                                    src="/logo_no_bg.png"
                                    alt="SYDE"
                                    width={52}
                                    height={52}
                                    priority
                                />
                                <span
                                    className={`text-4xl font-extrabold text-sydenightblue ${paperlogyClassName}`}
                                >
                                    <span style={{ letterSpacing: "0.01em" }}>S</span>
                                    <span style={{ letterSpacing: "0.01em" }}>Y</span>
                                    <span style={{ letterSpacing: "0em" }}>DE</span>
                                </span>
                            </Link>
                        </div>
                        <div className="w-1/3 flex justify-end items-center gap-4">
                            <Link
                                href="/search"
                                className="text-foreground hover:text-primary p-2 rounded-full hover:bg-secondary"
                            >
                                <Search size={20} />
                            </Link>
                            <Suspense
                                fallback={<div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />}
                            >
                                <NotificationBell
                                    initialUnreadCount={unreadNotifCount}
                                    userId={user?.id || null}
                                />
                            </Suspense>
                            <AuthButton
                                avatarUrl={avatarUrl}
                                username={usernameForAuthButton}
                                fullName={fullNameForAuthButton}
                                sheetHeader={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export function HeaderSkeleton({ paperlogyClassName }: { paperlogyClassName: string }) {
    return (
        <header>
            <div className="w-full bg-background">
                <div className="w-full max-w-6xl mx-auto flex justify-between items-center px-5 pt-3 pb-2 text-sm">
                    {/* Mobile specific layout Skeleton */}
                    <div className="flex md:hidden w-full justify-between items-center">
                        <div className="flex items-center">
                            <div className="flex items-center gap-1">
                                <Image src="/logo_no_bg.png" alt="SYDE" width={36} height={36} priority />
                                <span className={`text-2xl font-extrabold text-sydenightblue ${paperlogyClassName}`}>
                                    <span style={{ letterSpacing: "0.01em" }}>S</span>
                                    <span style={{ letterSpacing: "0.01em" }}>Y</span>
                                    <span style={{ letterSpacing: "0em" }}>DE</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-4">
                            <div className="p-2 rounded-full"><Search size={20} className="text-gray-300" /></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                    </div>

                    {/* Desktop specific layout Skeleton */}
                    <div className="hidden md:flex w-full justify-between items-center">
                        <div className="w-1/3">
                            <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-4 opacity-50">
                                <Image src="/kakao-talk-bw.png" alt="Kakao" width={24} height={24} />
                                <span className="hidden md:inline text-[#4B4737]">SYDE 오픈채팅</span>
                            </Button>
                        </div>
                        <div className="w-1/3 flex justify-center items-center font-semibold">
                            <div className="flex items-center gap-1">
                                <Image src="/logo_no_bg.png" alt="SYDE" width={52} height={52} priority />
                                <span className={`text-4xl font-extrabold text-sydenightblue ${paperlogyClassName}`}>
                                    <span style={{ letterSpacing: "0.01em" }}>S</span>
                                    <span style={{ letterSpacing: "0.01em" }}>Y</span>
                                    <span style={{ letterSpacing: "0em" }}>DE</span>
                                </span>
                            </div>
                        </div>
                        <div className="w-1/3 flex justify-end items-center gap-4">
                            <div className="p-2 rounded-full"><Search size={20} className="text-gray-300" /></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
