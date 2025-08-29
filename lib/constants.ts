import { Database } from "@/types/database.types";

export type ClubMemberRole =
  Database["public"]["Enums"]["club_member_role_enum"];
export type ClubPermissionLevel =
  Database["public"]["Enums"]["club_permission_level_enum"];
export type MeetupCategory =
  Database["public"]["Enums"]["meetup_category_enum"];
export type MeetupLocationType =
  Database["public"]["Enums"]["meetup_location_type_enum"];
export type MeetupParticipantStatus =
  Database["public"]["Enums"]["meetup_participant_status_enum"];
export type MeetupStatus = Database["public"]["Enums"]["meetup_status_enum"];

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

export const MEETUP_CATEGORIES = {
  STUDY: "STUDY",
  CHALLENGE: "CHALLENGE",
  NETWORKING: "NETWORKING",
  ETC: "ETC",
} as const;

export const MEETUP_LOCATION_TYPES = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
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

export const MEETUP_CATEGORY_DISPLAY_NAMES: Record<MeetupCategory, string> = {
  STUDY: "스터디",
  CHALLENGE: "챌린지",
  NETWORKING: "네트워킹",
  ETC: "기타",
};

export const MEETUP_LOCATION_TYPE_DISPLAY_NAMES: Record<
  MeetupLocationType,
  string
> = {
  ONLINE: "온라인",
  OFFLINE: "오프라인",
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
