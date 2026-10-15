import { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/static";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600; // 1 hour caching

type AuthorProfile = { username: string | null; updated_at: string | null } | null;

/** PostgREST가 to-one 조인을 객체 또는 길이 1짜리 배열로 돌려줄 수 있어 둘 다 받는다. */
function pickProfile(profiles: AuthorProfile | AuthorProfile[]): AuthorProfile {
    return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

const toDate = (value: string | null | undefined) => value?.split("T")[0];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 쿠키를 읽지 않는 클라이언트: 로그인 상태와 무관한 공개 데이터만 필요하고, revalidate 캐시를 유지한다.
    const supabase = createStaticClient();

    // 1. Fetch all data in parallel
    const [
        { data: meetups },
        { data: clubs },
        { data: blogPosts },
        { data: showcases }
    ] = await Promise.all([
        supabase.from("meetups").select("id, created_at"),
        supabase.from("clubs").select("id, updated_at"),
        supabase.from("blog_posts").select("id, slug, updated_at, profiles:user_id(username, updated_at)"),
        supabase.from("showcases").select("id, slug, updated_at, profiles:user_id(username, updated_at)")
    ]);

    // 2. Static Routes
    // "/feed"는 canonical이 "/"라서 제외한다. 날짜는 실제 변경 시점을 알 수 없으므로 넣지 않는다.
    const staticRoutes = ["", "/meetup", "/club", "/blog", "/showcase"].map(
        (route) => ({
            url: `${SITE_URL}${route}`,
        })
    );

    // 3. Meetups (meetups 테이블에는 updated_at이 없다)
    const meetupRoutes = (meetups || []).map((meetup) => ({
        url: `${SITE_URL}/meetup/${meetup.id}`,
        lastModified: toDate(meetup.created_at),
    }));

    // 4. Clubs
    const clubRoutes = (clubs || []).map((club) => ({
        url: `${SITE_URL}/club/${club.id}`,
        lastModified: toDate(club.updated_at),
    }));

    // 5. Blog posts
    const blogRoutes = (blogPosts || []).map((blogPost) => ({
        url: `${SITE_URL}/blog/${blogPost.slug || blogPost.id}`,
        lastModified: toDate(blogPost.updated_at),
    }));

    // 6. Showcases
    const showcaseRoutes = (showcases || []).map((showcase) => ({
        url: `${SITE_URL}/showcase/${showcase.slug || showcase.id}`,
        lastModified: toDate(showcase.updated_at),
    }));

    // 7. Profiles
    // 가입만 하고 활동이 없는 계정(얇은 페이지, 스팸 계정)을 색인에 올리지 않도록
    // 블로그 글이나 쇼케이스를 올린 작성자의 프로필만 포함한다.
    const profileByUsername = new Map<string, string | undefined>();
    for (const row of [...(blogPosts || []), ...(showcases || [])]) {
        const profile = pickProfile(row.profiles as AuthorProfile | AuthorProfile[]);
        if (profile?.username && !profileByUsername.has(profile.username)) {
            profileByUsername.set(profile.username, toDate(profile.updated_at));
        }
    }
    const profileRoutes = Array.from(profileByUsername, ([username, lastModified]) => ({
        url: `${SITE_URL}/@${username}`,
        lastModified,
    }));

    return [
        ...staticRoutes,
        ...meetupRoutes,
        ...clubRoutes,
        ...blogRoutes,
        ...showcaseRoutes,
        ...profileRoutes,
    ];
}
