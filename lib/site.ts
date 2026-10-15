/**
 * 사이트의 정규 origin(끝 슬래시 없음).
 * 메타데이터·사이트맵·robots·JSON-LD가 모두 이 값을 쓴다.
 */
function resolveSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000");
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "SYDE";

/** 대표 OG 이미지(public 기준 경로). */
export const DEFAULT_OG_IMAGE = "/we-are-syders.png";

/** JSON-LD처럼 절대 URL이 필요한 곳에서 경로를 origin과 합친다. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
