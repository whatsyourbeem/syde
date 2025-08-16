'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GatheringTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    router.push(`/gathering/${value}`);
  };

  const activeTab = pathname.split('/')[2] || 'meetup';

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="meetup">Meetup</TabsTrigger>
        <TabsTrigger value="club">Club</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
