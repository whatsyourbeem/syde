import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoginModalProvider } from "@/context/LoginModalContext"; // Import LoginModalProvider

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl = null;
  let usernameForAuthButton = null;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url, updated_at, username')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile for layout:', profileError);
    } else if (profile) {
      avatarUrl = profile.avatar_url ? `${profile.avatar_url}?t=${new Date(profile.updated_at).getTime()}` : null;
      usernameForAuthButton = profile.username || user.email?.split('@')[0] || null;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <LoginModalProvider> {/* Wrap with LoginModalProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
              <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-5 items-center font-semibold">
                  <Link href={"/"}>SYDE</Link>
                </div>
                <AuthButton avatarUrl={avatarUrl} username={usernameForAuthButton} />
              </div>
            </nav>
            {children}
          </ThemeProvider>
        </LoginModalProvider>
      </body>
    </html>
  );
}
