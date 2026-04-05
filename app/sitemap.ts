import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient();

    let baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : "http://localhost:3000");

    if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
    }

    // 1. Static Routes
    const staticRoutes = ["", "/log", "/meetup", "/gathering/club", "/insight", "/showcase"].map(
        (route) => ({
            url: `${baseUrl}${route}`,
            lastModified: new Date().toISOString(),
            changeFrequency: "daily" as const,
            priority: route === "" ? 1.0 : 0.8,
        })
    );

    // 2. Dynamic Routes: Profiles (/[username])
    const { data: profiles } = await supabase
        .from("profiles")
        .select("username, updated_at")
        .not("username", "is", null);

    const profileRoutes = (profiles || []).map((profile) => ({
        url: `${baseUrl}/${profile.username}`,
        lastModified: profile.updated_at || new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 3. Dynamic Routes: Logs (/log/[id])
    const { data: logs } = await supabase.from("logs").select("id, updated_at");

    const logRoutes = (logs || []).map((log) => ({
        url: `${baseUrl}/log/${log.id}`,
        lastModified: log.updated_at || new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 4. Dynamic Routes: Meetups (/meetup/[id])
    const { data: meetups } = await supabase
        .from("meetups")
        .select("id, created_at");

    const meetupRoutes = (meetups || []).map((meetup) => ({
        url: `${baseUrl}/meetup/${meetup.id}`,
        lastModified: meetup.created_at || new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 5. Dynamic Routes: Clubs (/gathering/club/[id])
    const { data: clubs } = await supabase.from("clubs").select("id, updated_at");

    const clubRoutes = (clubs || []).map((club) => ({
        url: `${baseUrl}/gathering/club/${club.id}`,
        lastModified: club.updated_at || new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 6. Dynamic Routes: Insights (/insight/[slug_or_id])
    const { data: insights } = await supabase
        .from("insights")
        .select("id, slug, updated_at");

    const insightRoutes = (insights || []).map((insight: any) => ({
        url: `${baseUrl}/insight/${insight.slug || insight.id}`,
        lastModified: insight.updated_at || new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 7. Dynamic Routes: Showcases (/showcase/[slug_or_id])
    const { data: showcases } = await supabase
        .from("showcases")
        .select("id, slug, updated_at");

    const showcaseRoutes = (showcases || []).map((showcase: any) => ({
        url: `${baseUrl}/showcase/${showcase.slug || showcase.id}`,
        lastModified: showcase.updated_at || new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        ...staticRoutes,
        ...profileRoutes,
        ...logRoutes,
        ...meetupRoutes,
        ...clubRoutes,
        ...insightRoutes,
        ...showcaseRoutes,
    ];
}
