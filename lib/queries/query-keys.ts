export const showcaseKeys = {
  all: ["showcases"] as const,
  lists: () => [...showcaseKeys.all, "list"] as const,
  list: (filters: any) => [...showcaseKeys.lists(), filters] as const,
  details: () => [...showcaseKeys.all, "detail"] as const,
  detail: (id: string) => [...showcaseKeys.details(), id] as const,
};

export const insightKeys = {
  all: ["insights"] as const,
  lists: () => [...insightKeys.all, "list"] as const,
  list: (filters: any) => [...insightKeys.lists(), filters] as const,
  details: () => [...insightKeys.all, "detail"] as const,
  detail: (id: string) => [...insightKeys.details(), id] as const,
};

export const logKeys = {
  all: ["logs"] as const,
  lists: () => [...logKeys.all, "list"] as const,
  list: (filters: any) => [...logKeys.lists(), filters] as const,
  details: () => [...logKeys.all, "detail"] as const,
  detail: (id: string) => [...logKeys.details(), id] as const,
};
