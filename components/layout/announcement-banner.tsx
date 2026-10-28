import { getVisibleAnnouncement } from "@/lib/queries/announcement-queries";
import { AnnouncementBar } from "@/components/layout/announcement-bar";

/** Renders the announcement bar for the current visible announcement, or nothing. */
export async function AnnouncementBanner() {
  const announcement = await getVisibleAnnouncement();
  if (!announcement) return null;

  return (
    <AnnouncementBar
      content={announcement.content}
      href={announcement.link_url}
      icon={announcement.icon}
    />
  );
}
