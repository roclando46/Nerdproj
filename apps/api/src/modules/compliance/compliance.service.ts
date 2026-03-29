import { prisma } from '@dcs/database';
import type { DBSStatus } from '@dcs/database';
import { encrypt, decrypt } from '../../lib/crypto.js';
import type {
  ListQuery,
  CreateDBSRecordInput,
  UpdateDBSRecordInput,
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
} from './compliance.schema.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const memberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  membershipNumber: true,
};

/** Strips the encrypted field and adds decrypted certificateNumber to a DBS record */
function decryptDbs<T extends { certificateNumberEncrypted: string | null }>(
  record: T,
): Omit<T, 'certificateNumberEncrypted'> & { certificateNumber: string | null } {
  const { certificateNumberEncrypted, ...rest } = record;
  return {
    ...rest,
    certificateNumber: certificateNumberEncrypted ? decrypt(certificateNumberEncrypted) : null,
  };
}

// ─── Compliance aggregate ─────────────────────────────────────────────────────

/**
 * Recomputes and upserts the ComplianceRecord cache for a member.
 * Called after every DBS or training record mutation.
 */
async function recomputeCompliance(memberId: string, clubId: string): Promise<void> {
  const now = new Date();

  const [latestDbs, safeHandsRecord] = await Promise.all([
    prisma.dBSRecord.findFirst({
      where: { memberId, clubId, isSuperseded: false },
      orderBy: { checkDate: 'desc' },
    }),
    prisma.trainingRecord.findFirst({
      where: {
        memberId,
        clubId,
        trainingType: 'SAFE_HANDS',
        isValid: true,
        OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
      },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  const dbsStatus: DBSStatus = latestDbs?.status ?? 'PENDING';
  const dbsExpiryDate = latestDbs?.expiryDate ?? null;
  const safeHandsValid = !!safeHandsRecord;
  const safeHandsExpiry = safeHandsRecord?.expiryDate ?? null;

  const dbsOk = dbsStatus === 'VALID' || dbsStatus === 'NOT_REQUIRED';
  const dbsNonCompliant = dbsStatus === 'EXPIRED' || dbsStatus === 'FLAGGED';
  const overallStatus = dbsNonCompliant ? 'NON_COMPLIANT' : dbsOk ? 'COMPLIANT' : 'PENDING';

  await prisma.complianceRecord.upsert({
    where: { memberId },
    update: { dbsStatus, dbsExpiryDate, safeHandsValid, safeHandsExpiry, overallStatus },
    create: {
      clubId,
      memberId,
      dbsStatus,
      dbsExpiryDate,
      safeHandsValid,
      safeHandsExpiry,
      overallStatus,
    },
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(clubId: string) {
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [totalMembers, compliant, nonCompliant, pending, expiringDbs, overdueTraining] =
    await Promise.all([
      prisma.complianceRecord.count({ where: { clubId } }),
      prisma.complianceRecord.count({ where: { clubId, overallStatus: 'COMPLIANT' } }),
      prisma.complianceRecord.count({ where: { clubId, overallStatus: 'NON_COMPLIANT' } }),
      prisma.complianceRecord.count({ where: { clubId, overallStatus: 'PENDING' } }),
      prisma.dBSRecord.findMany({
        where: {
          clubId,
          isSuperseded: false,
          status: 'VALID',
          expiryDate: { gte: now, lte: in90Days },
        },
        include: { member: { select: memberSelect } },
        orderBy: { expiryDate: 'asc' },
        take: 10,
      }),
      prisma.trainingRecord.findMany({
        where: {
          clubId,
          isValid: true,
          expiryDate: { lt: now },
        },
        include: { member: { select: memberSelect } },
        orderBy: { expiryDate: 'asc' },
        take: 10,
      }),
    ]);

  return {
    stats: { totalMembers, compliant, nonCompliant, pending },
    expiringDbs,
    overdueTraining,
  };
}

// ─── DBS Records ──────────────────────────────────────────────────────────────

export async function listDBSRecords(clubId: string, query: ListQuery) {
  const { page, limit, memberId, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    clubId,
    ...(memberId && { memberId }),
    ...(status && { status: status as DBSStatus }),
  };

  const [records, total] = await Promise.all([
    prisma.dBSRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { checkDate: 'desc' },
      include: { member: { select: memberSelect } },
    }),
    prisma.dBSRecord.count({ where }),
  ]);

  return {
    data: records.map(decryptDbs),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getDBSRecord(id: string, clubId: string) {
  const record = await prisma.dBSRecord.findFirst({
    where: { id, clubId },
    include: { member: { select: memberSelect } },
  });
  if (!record) return null;
  return decryptDbs(record);
}

export async function createDBSRecord(
  clubId: string,
  data: CreateDBSRecordInput,
  uploadedById?: string,
) {
  const { certificateNumber, checkDate, expiryDate, memberId, notes: _notes, ...rest } = data;

  // Mark any previous DBS records for this member as superseded
  await prisma.dBSRecord.updateMany({
    where: { memberId, clubId, isSuperseded: false },
    data: { isSuperseded: true },
  });

  const record = await prisma.dBSRecord.create({
    data: {
      clubId,
      memberId,
      certificateNumberEncrypted: certificateNumber ? encrypt(certificateNumber) : null,
      checkDate: new Date(checkDate),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      uploadedById: uploadedById ?? null,
      ...rest,
    },
    include: { member: { select: memberSelect } },
  });

  await recomputeCompliance(memberId, clubId);
  return decryptDbs(record);
}

export async function updateDBSRecord(id: string, clubId: string, data: UpdateDBSRecordInput) {
  const existing = await prisma.dBSRecord.findFirst({ where: { id, clubId } });
  if (!existing) return null;

  const { certificateNumber, checkDate, expiryDate, ...rest } = data;

  const record = await prisma.dBSRecord.update({
    where: { id },
    data: {
      ...(certificateNumber !== undefined && {
        certificateNumberEncrypted: certificateNumber ? encrypt(certificateNumber) : null,
      }),
      ...(checkDate && { checkDate: new Date(checkDate) }),
      ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
      ...rest,
    },
    include: { member: { select: memberSelect } },
  });

  await recomputeCompliance(existing.memberId, clubId);
  return decryptDbs(record);
}

// ─── Training Records ─────────────────────────────────────────────────────────

export async function listTrainingRecords(clubId: string, query: ListQuery) {
  const { page, limit, memberId } = query;
  const skip = (page - 1) * limit;

  const where = {
    clubId,
    ...(memberId && { memberId }),
  };

  const [data, total] = await Promise.all([
    prisma.trainingRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { completedAt: 'desc' },
      include: { member: { select: memberSelect } },
    }),
    prisma.trainingRecord.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTrainingRecord(id: string, clubId: string) {
  return prisma.trainingRecord.findFirst({
    where: { id, clubId },
    include: { member: { select: memberSelect } },
  });
}

export async function createTrainingRecord(clubId: string, data: CreateTrainingRecordInput) {
  const { memberId, completedAt, expiryDate, ...rest } = data;

  const record = await prisma.trainingRecord.create({
    data: {
      clubId,
      memberId,
      completedAt: new Date(completedAt),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isValid: expiryDate ? new Date(expiryDate) > new Date() : true,
      ...rest,
    },
    include: { member: { select: memberSelect } },
  });

  await recomputeCompliance(memberId, clubId);
  return record;
}

export async function updateTrainingRecord(
  id: string,
  clubId: string,
  data: UpdateTrainingRecordInput,
) {
  const existing = await prisma.trainingRecord.findFirst({ where: { id, clubId } });
  if (!existing) return null;

  const { completedAt, expiryDate, ...rest } = data;
  const newExpiry = expiryDate ? new Date(expiryDate) : existing.expiryDate;

  const record = await prisma.trainingRecord.update({
    where: { id },
    data: {
      ...(completedAt && { completedAt: new Date(completedAt) }),
      ...(expiryDate !== undefined && { expiryDate: newExpiry }),
      ...(newExpiry !== null && { isValid: newExpiry > new Date() }),
      ...rest,
    },
    include: { member: { select: memberSelect } },
  });

  await recomputeCompliance(existing.memberId, clubId);
  return record;
}

export async function deleteTrainingRecord(id: string, clubId: string) {
  const existing = await prisma.trainingRecord.findFirst({ where: { id, clubId } });
  if (!existing) return null;

  await prisma.trainingRecord.delete({ where: { id } });
  await recomputeCompliance(existing.memberId, clubId);
  return { id };
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getAlerts(clubId: string) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [expiringDbs30, expiringDbs90, expiredDbs, expiredTraining] = await Promise.all([
    prisma.dBSRecord.findMany({
      where: {
        clubId,
        isSuperseded: false,
        status: 'VALID',
        expiryDate: { gte: now, lte: in30Days },
      },
      include: { member: { select: memberSelect } },
      orderBy: { expiryDate: 'asc' },
    }),
    prisma.dBSRecord.findMany({
      where: {
        clubId,
        isSuperseded: false,
        status: 'VALID',
        expiryDate: { gt: in30Days, lte: in90Days },
      },
      include: { member: { select: memberSelect } },
      orderBy: { expiryDate: 'asc' },
    }),
    prisma.dBSRecord.findMany({
      where: { clubId, isSuperseded: false, status: { in: ['EXPIRED', 'FLAGGED'] } },
      include: { member: { select: memberSelect } },
      orderBy: { expiryDate: 'asc' },
    }),
    prisma.trainingRecord.findMany({
      where: { clubId, isValid: true, expiryDate: { lt: now } },
      include: { member: { select: memberSelect } },
      orderBy: { expiryDate: 'asc' },
    }),
  ]);

  return { expiringDbs30, expiringDbs90, expiredDbs, expiredTraining };
}

// ─── Members list (for form dropdowns) ───────────────────────────────────────

export async function listMembers(clubId: string) {
  return prisma.clubMember.findMany({
    where: { clubId, isActive: true },
    select: { id: true, firstName: true, lastName: true, email: true, membershipNumber: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}
