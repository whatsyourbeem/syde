import { NextResponse } from "next/server";
import ogs from "open-graph-scraper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Add timeout to prevent hanging requests
    const { result } = await ogs({
      url,
      timeout: 5000, // 5 second timeout
      fetchOptions: {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; OGBot/1.0)',
        }
      }
    });

    // Don't cache failures or pages without a title.
    if (!result.success || !result.ogTitle) {
      // Log only in development to reduce noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`OG data unavailable for: ${url}`);
      }
      // Return 404 instead of 500 - this is expected behavior for sites without OG tags
      return NextResponse.json(
        { error: "No OG data available" },
        { status: 404 }
      );
    }

    const ogData = {
      title: result.ogTitle,
      description: result.ogDescription,
      image: result.ogImage?.[0]?.url,
      url: result.ogUrl || url,
    };

    // Cache successful responses for 1 week, and allow serving stale content for 1 day while revalidating.
    return NextResponse.json(ogData, {
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Failed to fetch OG data for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    }
    // Return 404 instead of 500 - OG preview is optional
    // Don't cache errors
    return NextResponse.json(
      { error: "OG data fetch failed" },
      { status: 404 }
    );
  }
}
