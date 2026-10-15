import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    // /search는 일부러 막지 않는다. 막으면 크롤러가 noindex 메타를 읽지 못해 URL만 색인에 남을 수 있다.
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
                "/*/create",
                "/blog/write",
                "/password-protect"
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
