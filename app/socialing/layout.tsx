import SocialingTabs from "@/components/socialing/socialing-tabs";

export default function SocialingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <SocialingTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
