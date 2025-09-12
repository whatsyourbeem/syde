import { LogList } from "@/components/log/log-list";

export const revalidate = 30;

export default function LogPage() {
  return <LogList currentUserId={null} />;
}