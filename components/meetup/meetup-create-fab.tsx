"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MeetupCreateFab() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/meetup/create")}
      className="fixed bottom-10 right-10 w-14 h-14 rounded-full bg-sydeblue hover:bg-sydeblue/90 shadow-xl flex items-center justify-center p-0 z-50"
    >
      <Plus className="w-8 h-8 text-white" />
    </Button>
  );
}
