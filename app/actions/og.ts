'use server'

import ogs from 'open-graph-scraper'

export interface OGData {
  title?: string
  description?: string
  image?: string
  url: string
}

export async function getOgData(url:string): Promise<OGData | null> {
  try {
    const { result } = await ogs({ url })
    if (!result.success) {
      console.error('OGS error:', result.error)
      return null
    }

    return {
      title: result.ogTitle,
      description: result.ogDescription,
      image: result.ogImage?.[0]?.url,
      url: result.ogUrl || url,
    }
  } catch (error) {
    console.error('Error fetching OG data:', error)
    return null
  }
}
