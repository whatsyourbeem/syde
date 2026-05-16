"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import { PublicProfile } from "@/types/profile";
import Image from "next/image";
import Link from "next/link";
import { highlightText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getProfilesList } from "@/lib/queries/profile-queries";

const USERS_PER_PAGE = 10;

interface UserListProps {
  searchQuery: string;
}

export function UserList({ searchQuery }: UserListProps) {
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);

  const queryKey = ["users", { currentPage, searchQuery }];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      return getProfilesList(supabase, {
        currentPage,
        limit: USERS_PER_PAGE,
        searchQuery,
      });
    },
  });

  const users: PublicProfile[] = data?.users || [];
  const totalUsersCount = data?.count || 0;

  if (isLoading) {
    return <div className="text-center">사용자 검색 중...</div>;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">Error: {error?.message}</div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {users.length === 0 && !isLoading ? (
        <p className="text-center text-muted-foreground py-10">
          검색 결과가 없습니다.
        </p>
      ) : (
        users.map((userProfile) => (
          <div key={userProfile.id} className="border rounded-lg p-4 flex items-center space-x-4 bg-card shadow-sm">
            <Link href={`/${userProfile.username || userProfile.id}`}>
              {userProfile.avatar_url ? (
                <Image
                  src={`${userProfile.avatar_url}?t=${userProfile.updated_at ? new Date(userProfile.updated_at).getTime() : ''}`}
                  alt={`${userProfile.username || 'User'}'s avatar`}
                  width={60}
                  height={60}
                  className="rounded-full object-cover aspect-square"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl font-bold">
                  {userProfile.full_name
                    ? userProfile.full_name[0].toUpperCase()
                    : userProfile.username
                    ? userProfile.username[0]?.toUpperCase() || "U"
                    : "U"}
                </div>
              )}
            </Link>
            <div className="flex-grow">
              <Link href={`/${userProfile.username || userProfile.id}`}>
                <p className="font-semibold text-lg hover:underline">
                  {highlightText(userProfile.full_name || userProfile.username || "Anonymous", searchQuery)}
                </p>
              </Link>
              {userProfile.username && (
                <p className="text-sm text-muted-foreground">
                  @{highlightText(userProfile.username, searchQuery)}
                </p>
              )}
              {userProfile.tagline && (
                <p className="text-sm text-muted-foreground mt-1">
                  {highlightText(userProfile.tagline, searchQuery)}
                </p>
              )}
              
            </div>
          </div>
        ))
      )}
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from(
          { length: Math.ceil(totalUsersCount / USERS_PER_PAGE) },
          (_, i) => (
            <Button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              variant={currentPage === i + 1 ? "default" : "outline"}
              disabled={isLoading}
            >
              {i + 1}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
