import { NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const { result } = await ogs({ url });

    // Don't cache failures or pages without a title.
    if (!result.success || !result.ogTitle) {
      console.error(`OGS error for ${url}:`, result.error);
      return NextResponse.json(
        { error: 'Failed to retrieve OG data or no title found' },
        { status: 500 }
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
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`Error fetching OG data for ${url}:`, error);
    // Don't cache errors
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}