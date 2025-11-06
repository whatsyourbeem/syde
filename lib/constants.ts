import { Database } from "@/types/database.types";

export type ClubMemberRole =
  Database["public"]["Enums"]["club_member_role_enum"];
export type ClubPermissionLevel =
  Database["public"]["Enums"]["club_permission_level_enum"];
export type MeetupParticipantStatus =
  Database["public"]["Enums"]["meetup_participant_status_enum"];
export type MeetupStatus = Database["public"]["Enums"]["meetup_status_enum"];
export type MeetupType = Database["public"]["Enums"]["meetup_type_enum"];

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

export const MEETUP_PARTICIPANT_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const MEETUP_STATUSES = {
  UPCOMING: "UPCOMING",
  APPLY_AVAILABLE: "APPLY_AVAILABLE",
  APPLY_CLOSED: "APPLY_CLOSED",
  ENDED: "ENDED",
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
  PUBLIC: "전체 공개",
  MEMBER: "모든 멤버",
  FULL_MEMBER: "정회원",
  LEADER: "클럽장",
};

export const MEETUP_PARTICIPANT_STATUS_DISPLAY_NAMES: Record<
  MeetupParticipantStatus,
  string
> = {
  PENDING: "대기중",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};

export const MEETUP_STATUS_DISPLAY_NAMES: Record<MeetupStatus, string> = {
  UPCOMING: "오픈예정",
  APPLY_AVAILABLE: "신청가능",
  APPLY_CLOSED: "신청마감",
  ENDED: "종료",
};

export const MEETUP_TYPES = {
  INSYDE: "INSYDE",
  SPINOFF: "SPINOFF",
} as const;

export const MEETUP_TYPE_DISPLAY_NAMES: Record<MeetupType, string> = {
  INSYDE: "정기모임",
  SPINOFF: "스핀오프",
};
