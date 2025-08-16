import GatheringTabs from '@/components/gathering/gathering-tabs';

export default function GatheringLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gathering</h1>
      <GatheringTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
