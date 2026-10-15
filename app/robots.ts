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
                // robots.txt 패턴은 접두사 매칭이라 $로 끝을 고정한다. 안 그러면 /showcase/creator-hub, /blog/write-better 같은 slug까지 막힌다.
                "/*/edit$",
                "/showcase/edit/",
                "/*/create$",
                "/blog/write$",
                "/password-protect"
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
