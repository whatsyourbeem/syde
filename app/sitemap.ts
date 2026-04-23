import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600; // 1 hour caching

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

    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch all data in parallel
    const [
        { data: meetups },
        { data: clubs },
        { data: insights },
        { data: showcases }
    ] = await Promise.all([
        supabase.from("meetups").select("id, created_at"),
        supabase.from("clubs").select("id, updated_at"),
        supabase.from("insights").select("id, slug, updated_at"),
        supabase.from("showcases").select("id, slug, updated_at")
    ]);

    // 2. Static Routes
    const staticRoutes = ["", "/log", "/meetup", "/club", "/insight", "/showcase"].map(
        (route) => ({
            url: `${baseUrl}${route}`,
            lastModified: today,
            changeFrequency: "daily" as const,
            priority: route === "" ? 1.0 : 0.8,
        })
    );

    // 3. Meetups
    const meetupRoutes = (meetups || []).map((meetup) => ({
        url: `${baseUrl}/meetup/${meetup.id}`,
        lastModified: (meetup.created_at || today).split("T")[0],
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 6. Clubs
    const clubRoutes = (clubs || []).map((club: any) => ({
        url: `${baseUrl}/club/${club.id}`,
        lastModified: (club.updated_at || today).split("T")[0],
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 7. Insights
    const insightRoutes = (insights || []).map((insight: any) => ({
        url: `${baseUrl}/insight/${insight.slug || insight.id}`,
        lastModified: (insight.updated_at || today).split("T")[0],
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 8. Showcases
    const showcaseRoutes = (showcases || []).map((showcase: any) => ({
        url: `${baseUrl}/showcase/${showcase.slug || showcase.id}`,
        lastModified: (showcase.updated_at || today).split("T")[0],
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        ...staticRoutes,
        ...meetupRoutes,
        ...clubRoutes,
        ...insightRoutes,
        ...showcaseRoutes,
    ];
}
