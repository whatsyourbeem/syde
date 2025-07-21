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

  

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', uniqueUsernames);

  if (error) {
    console.error('Error fetching profiles for mentions:', error);
    return content; // Gracefully fail by returning original content
  }

  

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

export function linkifyMentions(text: string, profiles: any[], searchQuery?: string) {
  
  const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
  const parts = text.split(mentionRegex);

  return parts.flatMap((part, i) => { // Changed to flatMap
    if (i % 2 === 1) {
      const userId = part;
      const profile = profiles.find((p) => p.id === userId);
      const username = profile ? profile.username : "unknown";
      return (
        <Link
          key={`mention-${i}`} // Ensure unique key for Link
          href={`/${username}`}
          className="text-blue-500 hover:underline font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          @{username}
        </Link>
      );
    }
    // Apply highlightText only to the string parts
    const highlightedPart = searchQuery ? highlightText(part, searchQuery, `part-${i}`) : [part]; // Always return array
    
    // flatMap will flatten the array returned by highlightText
    return highlightedPart;
  });
}

export function highlightText(text: string, query: string, baseKey: string = ''): React.ReactNode[] {
  
  if (!query || typeof text !== 'string') {
    
    return [text]; // Always return an array, even if just a string
  }
  const parts: React.ReactNode[] = []; // Change type to React.ReactNode[]
  const regex = new RegExp(`(${query})`, 'gi'); // Case-insensitive, global
  let lastIndex = 0;
  let match;

  let keyCounter = 0; // Use a counter for unique keys within this function call

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={`${baseKey}-str-${keyCounter++}`}>{text.substring(lastIndex, match.index)}</React.Fragment>);
    }
    // Add the highlighted match
    parts.push(
      <span key={`${baseKey}-highlight-${keyCounter++}`} className="font-bold">
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(<React.Fragment key={`${baseKey}-str-${keyCounter++}`}>{text.substring(lastIndex)}</React.Fragment>);
  }
  
  return parts;
}