import type { ShowcaseQueryOptions } from "./showcase-queries";
import type { LogQueryOptions } from "./log-queries";
import type { MeetupsListOptions } from "./meetup-queries";
import type { ProfilesListOptions } from "./profile-queries";

export const showcaseKeys = {
  all: ["showcases"] as const,
  lists: () => [...showcaseKeys.all, "list"] as const,
  list: (filters: Partial<ShowcaseQueryOptions>) => [...showcaseKeys.lists(), filters] as const,
  details: () => [...showcaseKeys.all, "detail"] as const,
  detail: (id: string) => [...showcaseKeys.details(), id] as const,
};

export const insightKeys = {
  all: ["insights"] as const,
  lists: () => [...insightKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...insightKeys.lists(), filters] as const,
  details: () => [...insightKeys.all, "detail"] as const,
  detail: (id: string) => [...insightKeys.details(), id] as const,
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
