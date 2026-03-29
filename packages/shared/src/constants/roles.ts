export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CLUB_ADMIN: 'CLUB_ADMIN',
  CLUB_OFFICIAL: 'CLUB_OFFICIAL',
  CLUB_MEMBER: 'CLUB_MEMBER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  CLUB_ADMIN: 'Club Admin',
  CLUB_OFFICIAL: 'Club Official',
  CLUB_MEMBER: 'Member',
};

/** Roles that can manage other users and club settings */
export const ADMIN_ROLES: UserRole[] = [USER_ROLES.SUPER_ADMIN, USER_ROLES.CLUB_ADMIN];

/** Roles that can manage compliance records */
export const COMPLIANCE_ROLES: UserRole[] = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.CLUB_ADMIN,
  USER_ROLES.CLUB_OFFICIAL,
];
