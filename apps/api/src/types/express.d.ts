// Express Request type augmentation — adds DCS-specific properties set by middleware
declare namespace Express {
  interface Request {
    clubId: string;
    userRole: string;
  }
}
