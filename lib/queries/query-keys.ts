import type { ShowcaseQueryOptions } from "./showcase-queries";
import type { LogQueryOptions } from "./log-queries";
import type { MeetupsListOptions } from "./meetup-queries";
import type { ProfilesListOptions } from "./profile-queries";

export const showcaseKeys = {
  all: ["showcases"] as const,
  lists: () => [...showcaseKeys.all, "list"] as const,
  // currentPage는 페이지 번호 방식을 쓰는 검색 목록용
  list: (filters: Partial<ShowcaseQueryOptions> & { currentPage?: number }) => [...showcaseKeys.lists(), filters] as const,
  details: () => [...showcaseKeys.all, "detail"] as const,
  detail: (id: string) => [...showcaseKeys.details(), id] as const,
};

export const blogKeys = {
  all: ["blog-posts"] as const,
  lists: () => [...blogKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, "detail"] as const,
  detail: (id: string) => [...blogKeys.details(), id] as const,
};

export const logKeys = {
  all: ["logs"] as const,
  lists: () => [...logKeys.all, "list"] as const,
  list: (filters: Partial<LogQueryOptions>) => [...logKeys.lists(), filters] as const,
  details: () => [...logKeys.all, "detail"] as const,
  detail: (id: string) => [...logKeys.details(), id] as const,
};

export const meetupKeys = {
  all: ["meetups"] as const,
  lists: () => [...meetupKeys.all, "list"] as const,
  list: (filters: Partial<MeetupsListOptions>) => [...meetupKeys.lists(), filters] as const,
  details: () => [...meetupKeys.all, "detail"] as const,
  detail: (id: string) => [...meetupKeys.details(), id] as const,
};

export const clubKeys = {
  all: ["clubs"] as const,
  lists: () => [...clubKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...clubKeys.lists(), filters] as const,
  details: () => [...clubKeys.all, "detail"] as const,
  detail: (id: string) => [...clubKeys.details(), id] as const,
};

export const feedKeys = {
  all: ["feed"] as const,
  lists: () => [...feedKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...feedKeys.lists(), filters] as const,
  details: () => [...feedKeys.all, "detail"] as const,
  detail: (id: string) => [...feedKeys.details(), id] as const,
};

export const profileKeys = {
  all: ["profiles"] as const,
  lists: () => [...profileKeys.all, "list"] as const,
  list: (filters: Partial<ProfilesListOptions>) => [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...notificationKeys.lists(), filters] as const,
};

/** 목록 쿼리가 "신선"하다고 보는 시간(ms). 이 안에서는 창 포커스·재마운트로 다시 요청하지 않는다. */
export const LIST_STALE_TIME = 60 * 1000;
