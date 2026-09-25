import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notification/notification-bell";
import { ClientAuthButton } from "@/components/auth/client-auth-button";
import { MobileMenu } from "@/components/layout/mobile-menu";

// Using local fonts loaded from layout.tsx
// Since we can't easily import the localFont instance instantiated in layout.tsx,
// we just pass the className string or assume it inherits via cascade for the logo.
// But the logo used paperlogy.className. We can import it if we extract it, but for now
// we can just use the global CSS fallback or pass it as prop if needed.
// Actually, it's safer to extract the Header completely.

// No cookies/auth are read here — the whole header renders the same markup for
// everyone (see context/AuthContext.tsx), so this route stays eligible for the
// Full Route Cache instead of forcing every page under it to render dynamically.
export function HeaderServer({ paperlogyClassName }: { paperlogyClassName: string }) {
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
                                    className={`text-2xl font-extrabold text-sydeblue ${paperlogyClassName}`}
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
                            <NotificationBell />
                            <MobileMenu
                                authButton={
                                    <ClientAuthButton sheetHeader={true} />
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
                                    className={`text-4xl font-extrabold text-sydeblue ${paperlogyClassName}`}
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
                            <NotificationBell />
                            <ClientAuthButton sheetHeader={false} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
