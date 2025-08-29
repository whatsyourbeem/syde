'use client'

import { useEffect, useState } from 'react'
import { getOgData, type OGData } from '@/app/actions/og'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface OgPreviewCardProps {
  url: string
}

export function OgPreviewCard({ url }: OgPreviewCardProps) {
  const [ogData, setOgData] = useState<OGData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      if (!url) return
      setIsLoading(true)
      try {
        const data = await getOgData(url)
        if (isMounted) {
          setOgData(data)
        }
      } catch (error) {
        console.error("Failed to fetch OG data", error)
        if (isMounted) {
          setOgData(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    fetchData()

    return () => {
      isMounted = false
    }
  }, [url])

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 my-2">
        <Skeleton className="h-24 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    )
  }

  if (!ogData || (!ogData.title && !ogData.description)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline my-2 block">
        {url}
      </a>
    )
  }

  return (
    <a href={ogData.url} target="_blank" rel="noopener noreferrer" className="not-prose block">
      <Card className="my-4 flex overflow-hidden transition-colors hover:bg-muted/50">
        {ogData.image && (
          <div className="w-44 h-32 flex-shrink-0 bg-muted">
            <img src={ogData.image} alt={ogData.title || 'OG Image'} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-4 flex flex-col justify-center">
          {ogData.title && <div className="font-semibold line-clamp-1">{ogData.title}</div>}
          {ogData.description && <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{ogData.description}</div>}
          <div className="text-xs text-muted-foreground mt-2 line-clamp-1">{ogData.url}</div>
        </div>
      </Card>
    </a>
  )
}
