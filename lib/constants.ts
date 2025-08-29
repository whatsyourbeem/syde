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
  STUDY: "스터디",
  CHALLENGE: "챌린지",
  NETWORKING: "네트워킹",
  ETC: "기타",
} as const;

export const MEETUP_LOCATION_TYPES = {
  ONLINE: "온라인",
  OFFLINE: "오프라인",
} as const;

export const MEETUP_PARTICIPANT_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const MEETUP_STATUSES = {
  UPCOMING: "오픈예정",
  APPLY_AVAILABLE: "신청가능",
  APPLY_CLOSED: "신청마감",
  ENDED: "종료",
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
  pending: "대기중",
  approved: "승인됨",
  rejected: "거절됨",
};

export const MEETUP_STATUS_DISPLAY_NAMES: Record<MeetupStatus, string> = {
  UPCOMING: "오픈예정",
  OPEN: "신청가능",
  CLOSED: "신청마감",
  FINISHED: "종료",
};
