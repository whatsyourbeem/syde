/** @jsxImportSource react */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import Link from "next/link";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/database.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function processMentionsForSave(
  content: string,
  supabase: SupabaseClient<Database>
) {
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const usernames = Array.from(content.matchAll(mentionRegex), (m) => m[1]);

  if (usernames.length === 0) {
    return content;
  }

  const uniqueUsernames = [...new Set(usernames)];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("username", uniqueUsernames);

  if (error) {
    console.error("Error fetching profiles for mentions:", error);
    return content; // Gracefully fail by returning original content
  }

  let processedContent = content;
  for (const profile of profiles) {
    const userMentionRegex = new RegExp(
      `@${profile.username}(?![a-zA-Z0-9_.]|$)`,
      "g"
    );
    processedContent = processedContent.replace(
      userMentionRegex,
      `[mention:${profile.id}]`
    );
  }

  return processedContent;
}

export function linkifyMentions(
  text: string,
  profiles: Array<{ id: string; username: string | null }>,
  searchQuery?: string
) {
  const mentionRegex = /\[mention:([a-f0-9\-]+)\]/g;
  const parts = text.split(mentionRegex);

  return parts.flatMap((part, i) => {
    // Changed to flatMap
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
    const highlightedPart = searchQuery
      ? highlightText(part, searchQuery, `part-${i}`)
      : [part]; // Always return array

    // flatMap will flatten the array returned by highlightText
    return highlightedPart;
  });
}

export function isTiptapJsonEmpty(jsonContent: Json | null): boolean {
  if (!jsonContent) {
    return true;
  }

  // Fallback: if getPlainTextFromTiptapJson returns an empty string, consider it empty
  return getPlainTextFromTiptapJson(jsonContent).trim() === "";
}

export function getPlainTextFromTiptapJson(jsonContent: Json | null): string {
  if (!jsonContent) {
    return "";
  }

  let parsedContent: Json;
  if (typeof jsonContent === "string") {
    try {
      parsedContent = JSON.parse(jsonContent);
    } catch (e) {
      console.error("Failed to parse Tiptap JSON string:", e);
      return String(jsonContent); // Return original string if parsing fails
    }
  } else {
    parsedContent = jsonContent;
  }

  let plainText = "";

  function traverse(node: Json) {
    if (typeof node === "object" && node !== null) {
      if ("text" in node && typeof node.text === "string") {
        plainText += node.text;
      }
      if ("content" in node && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    }
  }

  traverse(parsedContent);
  return plainText;
}

export function highlightText(
  text: string,
  query: string,
  baseKey: string = ""
): React.ReactNode[] {
  if (!query || typeof text !== "string") {
    return [text]; // Always return an array, even if just a string
  }
  const parts: React.ReactNode[] = []; // Change type to React.ReactNode[]
  const regex = new RegExp(`(${query})`, "gi"); // Case-insensitive, global
  let lastIndex = 0;
  let match;

  let keyCounter = 0; // Use a counter for unique keys within this function call

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`${baseKey}-str-${keyCounter++}`}>
          {text.substring(lastIndex, match.index)}
        </React.Fragment>
      );
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
    parts.push(
      <React.Fragment key={`${baseKey}-str-${keyCounter++}`}>
        {text.substring(lastIndex)}
      </React.Fragment>
    );
  }

  return parts;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;

  if (diffSeconds < minute) {
    return "방금";
  } else if (diffSeconds < hour) {
    return `${Math.floor(diffSeconds / minute)}분 전`;
  } else if (diffSeconds < day) {
    return `${Math.floor(diffSeconds / hour)}시간 전`;
  } else if (diffSeconds < week) {
    return `${Math.floor(diffSeconds / day)}일 전`;
  } else {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const dayOfMonth = date.getDate().toString().padStart(2, "0");
    const currentYear = now.getFullYear();

    if (year === currentYear) {
      return `${parseInt(month)}월 ${parseInt(dayOfMonth)}일`;
    } else {
      return `${year}.${month}.${dayOfMonth}`;
    }
  }
}

/**
 * Converts HTTP URLs to HTTPS for security
 * @param url - The URL to convert
 * @returns The URL with HTTPS protocol, or null if invalid
 */
export function upgradeToHttps(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    // If already HTTPS or other secure protocol, return as is
    if (urlObj.protocol === "https:" || urlObj.protocol === "data:") {
      return url;
    }

    // Convert HTTP to HTTPS
    if (urlObj.protocol === "http:") {
      urlObj.protocol = "https:";
      return urlObj.toString();
    }

    // For other protocols, return as is
    return url;
  } catch (error) {
    console.warn("Invalid URL provided to upgradeToHttps:", url);
    return null;
  }
}

/**
 * Ensures an image URL is secure (HTTPS)
 * @param imageUrl - The image URL to check
 * @returns Secure image URL or null
 */
export function ensureSecureImageUrl(imageUrl: string | null | undefined): string | null {
  return upgradeToHttps(imageUrl);
}
