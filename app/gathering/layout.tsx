import GatheringTabs from "@/components/gathering/gathering-tabs";

export default function GatheringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <GatheringTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
