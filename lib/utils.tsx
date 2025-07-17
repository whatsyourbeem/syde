/** @jsxImportSource react */
/** @jsxImportSource react */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import Link from "next/link";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function processMentionsForSave(content: string, supabase: any) {
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const usernames = Array.from(content.matchAll(mentionRegex), (m) => m[1]);

  if (usernames.length === 0) {
    return content;
  }

  const uniqueUsernames = [...new Set(usernames)];

  console.log("Searching for usernames:", uniqueUsernames); // Debug log

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', uniqueUsernames);

  if (error) {
    console.error('Error fetching profiles for mentions:', error);
    return content; // Gracefully fail by returning original content
  }

  console.log("Found profiles:", profiles); // Debug log

  let processedContent = content;
  for (const profile of profiles) {
    const userMentionRegex = new RegExp(`@${profile.username}(?![a-zA-Z0-9_.]|$)`, 'g');
    processedContent = processedContent.replace(
      userMentionRegex,
      `[mention:${profile.id}]`
    );
  }

  return processedContent;
}

export function linkifyMentions(text: string, profiles: any[]) {
  const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
  const parts = text.split(mentionRegex);

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const userId = part;
      const profile = profiles.find((p) => p.id === userId);
      const username = profile ? profile.username : "unknown";
      return (
        <Link
          key={i}
          href={`/${username}`}
          className="text-blue-500 hover:underline font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          @{username}
        </Link>
      );
    }
    return part;
  });
}
