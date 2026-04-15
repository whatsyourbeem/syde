import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    let baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : "http://localhost:3000");

    if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
    }

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/api/",
                "/auth/",
                "/settings/",
                "/profile",
                "/*/edit",
                "/password-protect"
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
