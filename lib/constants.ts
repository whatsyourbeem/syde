import { Database } from "@/types/database.types";

export type ClubMemberRole =
  Database["public"]["Enums"]["club_member_role_enum"];
export type ClubPermissionLevel =
  Database["public"]["Enums"]["club_permission_level_enum"];

export const CLUB_MEMBER_ROLES = {
  LEADER: "LEADER",
  FULL_MEMBER: "FULL_MEMBER",
  GENERAL_MEMBER: "GENERAL_MEMBER",
} as const;

export const CLUB_PERMISSION_LEVELS = {
  PUBLIC: "PUBLIC",
  MEMBER: "MEMBER",
  FULL_MEMBER: "FULL_MEMBER",
  LEADER: "LEADER",
} as const;

export const CLUB_MEMBER_ROLE_DISPLAY_NAMES: Record<ClubMemberRole, string> = {
  LEADER: "클럽장",
  FULL_MEMBER: "정회원",
  GENERAL_MEMBER: "준회원",
};

export const CLUB_PERMISSION_LEVEL_DISPLAY_NAMES: Record<
  ClubPermissionLevel,
  string
> = {
  PUBLIC: "전체공개",
  MEMBER: "전체멤버",
  FULL_MEMBER: "정회원",
  LEADER: "클럽장",
};
