export const DBS_STATUS = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING: 'PENDING',
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  FLAGGED: 'FLAGGED',
} as const;

export type DBSStatus = (typeof DBS_STATUS)[keyof typeof DBS_STATUS];

export const DBS_STATUS_LABELS: Record<DBSStatus, string> = {
  NOT_REQUIRED: 'Not Required',
  PENDING: 'Pending',
  VALID: 'Valid',
  EXPIRED: 'Expired',
  FLAGGED: 'Flagged',
};

export const TRAINING_TYPES = {
  SAFE_HANDS: 'SAFE_HANDS',
  WELFARE_OFFICER: 'WELFARE_OFFICER',
  FIRST_AID: 'FIRST_AID',
  COACHING_LEVEL_1: 'COACHING_LEVEL_1',
  COACHING_LEVEL_2: 'COACHING_LEVEL_2',
  DBS_AWARENESS: 'DBS_AWARENESS',
  CUSTOM: 'CUSTOM',
} as const;

export type TrainingType = (typeof TRAINING_TYPES)[keyof typeof TRAINING_TYPES];

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  SAFE_HANDS: 'ECB Safe Hands',
  WELFARE_OFFICER: 'Welfare Officer',
  FIRST_AID: 'First Aid',
  COACHING_LEVEL_1: 'Coaching Level 1',
  COACHING_LEVEL_2: 'Coaching Level 2',
  DBS_AWARENESS: 'DBS Awareness',
  CUSTOM: 'Custom',
};

/** Number of days before expiry to trigger an alert */
export const EXPIRY_WARNING_DAYS = 30;

/** DBS records older than this many years should be flagged for review (ICO guidance) */
export const DBS_RETENTION_YEARS = 7;
