import { prisma } from '@dcs/database';
import type { FixtureStatus, VolunteerRole } from '@dcs/database';
import { Prisma } from '@dcs/database';
import type {
  ListQuery,
  CreateFixtureInput,
  UpdateFixtureInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  UpsertVolunteerProfileInput,
  AutoSuggestInput,
} from './fixtures.schema.js';

const DEV_USER_ID = 'cldevadmin00000000001';

// ─── DBS join helper ──────────────────────────────────────────────────────────

const volunteerWithDbs = {
  include: {
    member: {
      include: {
        complianceRecord: { select: { dbsStatus: true, dbsExpiryDate: true } },
      },
    },
  },
};

type NormalizedDbs = { dbsStatus: string; dbsExpiryDate: Date | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeVolunteerDbs<T extends Record<string, any>>(v: T): T {
  if (!v.member) return v;
  const complianceRecord: NormalizedDbs = v.member.complianceRecord ?? {
    dbsStatus: 'PENDING',
    dbsExpiryDate: null,
  };
  return { ...v, member: { ...v.member, complianceRecord } };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export async function listFixtures(clubId: string, query: ListQuery) {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    clubId,
    ...(status && { status: status as FixtureStatus }),
  };

  const [fixtures, total] = await Promise.all([
    prisma.fixture.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fixtureDate: 'asc' },
      include: { _count: { select: { volunteerAssignments: true } } },
    }),
    prisma.fixture.count({ where }),
  ]);

  return { data: fixtures, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUpcoming(clubId: string) {
  const now = new Date();
  const fixtures = await prisma.fixture.findMany({
    where: {
      clubId,
      status: { notIn: ['CANCELLED' as FixtureStatus] },
      fixtureDate: { gte: now },
    },
    orderBy: { fixtureDate: 'asc' },
    take: 8,
    include: { _count: { select: { volunteerAssignments: true } } },
  });
  return { data: fixtures };
}

export async function createFixture(
  clubId: string,
  userId: string | undefined,
  data: CreateFixtureInput,
) {
  const { fixtureDate, ...rest } = data;
  return prisma.fixture.create({
    data: {
      clubId,
      createdById: userId ?? DEV_USER_ID,
      fixtureDate: new Date(fixtureDate),
      ...rest,
    },
    include: { _count: { select: { volunteerAssignments: true } } },
  });
}

export async function getFixture(id: string, clubId: string) {
  const fixture = await prisma.fixture.findFirst({
    where: { id, clubId },
    include: {
      _count: { select: { volunteerAssignments: true } },
      volunteerAssignments: {
        include: {
          volunteer: volunteerWithDbs,
          assignedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!fixture) return null;

  return {
    ...fixture,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volunteerAssignments: fixture.volunteerAssignments.map((a: any) => ({
      ...a,
      volunteer: normalizeVolunteerDbs(a.volunteer),
    })),
  };
}

export async function updateFixture(id: string, clubId: string, data: UpdateFixtureInput) {
  const existing = await prisma.fixture.findFirst({ where: { id, clubId } });
  if (!existing) return null;

  const { fixtureDate, ...rest } = data;
  return prisma.fixture.update({
    where: { id },
    data: {
      ...rest,
      ...(fixtureDate && { fixtureDate: new Date(fixtureDate) }),
    },
    include: { _count: { select: { volunteerAssignments: true } } },
  });
}

export async function deleteFixture(id: string, clubId: string) {
  const existing = await prisma.fixture.findFirst({ where: { id, clubId } });
  if (!existing) return null;

  return prisma.fixture.update({
    where: { id },
    data: { status: 'CANCELLED' as FixtureStatus },
    include: { _count: { select: { volunteerAssignments: true } } },
  });
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function listAssignments(fixtureId: string, clubId: string) {
  const fixture = await prisma.fixture.findFirst({ where: { id: fixtureId, clubId } });
  if (!fixture) return null;

  const assignments = await prisma.volunteerAssignment.findMany({
    where: { fixtureId },
    include: {
      volunteer: volunteerWithDbs,
      assignedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return assignments.map((a: any) => ({ ...a, volunteer: normalizeVolunteerDbs(a.volunteer) }));
}

export async function createAssignment(
  fixtureId: string,
  clubId: string,
  userId: string | undefined,
  data: CreateAssignmentInput,
) {
  const fixture = await prisma.fixture.findFirst({ where: { id: fixtureId, clubId } });
  if (!fixture) return null;

  const volunteerProfile = await prisma.volunteerProfile.findFirst({
    where: { id: data.volunteerId, clubId },
  });
  if (!volunteerProfile) return null;

  try {
    const assignment = await prisma.volunteerAssignment.create({
      data: {
        fixtureId,
        volunteerId: data.volunteerId,
        assignedById: userId ?? DEV_USER_ID,
        role: data.role as VolunteerRole,
        customRoleName: data.customRoleName,
        notes: data.notes,
      },
      include: {
        volunteer: volunteerWithDbs,
        assignedBy: { select: { firstName: true, lastName: true } },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      ...(assignment as any),
      volunteer: normalizeVolunteerDbs((assignment as any).volunteer),
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { error: 'DUPLICATE_ASSIGNMENT' as const };
    }
    throw err;
  }
}

export async function updateAssignment(
  id: string,
  fixtureId: string,
  clubId: string,
  data: UpdateAssignmentInput,
) {
  const fixture = await prisma.fixture.findFirst({ where: { id: fixtureId, clubId } });
  if (!fixture) return null;

  const existing = await prisma.volunteerAssignment.findFirst({
    where: { id, fixtureId },
  });
  if (!existing) return null;

  const { confirmedAt, declinedAt, ...rest } = data;
  const assignment = await prisma.volunteerAssignment.update({
    where: { id },
    data: {
      ...rest,
      ...(confirmedAt !== undefined && { confirmedAt: confirmedAt ? new Date(confirmedAt) : null }),
      ...(declinedAt !== undefined && { declinedAt: declinedAt ? new Date(declinedAt) : null }),
    },
    include: {
      volunteer: volunteerWithDbs,
      assignedBy: { select: { firstName: true, lastName: true } },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    ...(assignment as any),
    volunteer: normalizeVolunteerDbs((assignment as any).volunteer),
  };
}

export async function deleteAssignment(id: string, fixtureId: string, clubId: string) {
  const fixture = await prisma.fixture.findFirst({ where: { id: fixtureId, clubId } });
  if (!fixture) return null;

  const existing = await prisma.volunteerAssignment.findFirst({ where: { id, fixtureId } });
  if (!existing) return null;

  await prisma.volunteerAssignment.delete({ where: { id } });
  return { id };
}

export async function autoSuggestVolunteers(
  fixtureId: string,
  clubId: string,
  input: AutoSuggestInput,
) {
  const fixture = await prisma.fixture.findFirst({ where: { id: fixtureId, clubId } });
  if (!fixture) return null;

  const existing = await prisma.volunteerAssignment.findMany({
    where: { fixtureId },
    select: { volunteerId: true },
  });
  const assignedIds = existing.map((a) => a.volunteerId);

  const candidates = await prisma.volunteerProfile.findMany({
    where: {
      clubId,
      availableRoles: { has: input.role as VolunteerRole },
      id: { notIn: assignedIds },
    },
    include: {
      member: {
        include: {
          complianceRecord: { select: { dbsStatus: true, dbsExpiryDate: true } },
        },
      },
    },
  });

  if (candidates.length === 0) return [];

  const candidateIds = candidates.map((c) => c.id);

  const counts = await prisma.volunteerAssignment.groupBy({
    by: ['volunteerId'],
    _count: true,
    where: { volunteerId: { in: candidateIds } },
  });

  const countMap = new Map(counts.map((c) => [c.volunteerId, c._count]));

  return candidates
    .map((c) => ({
      ...normalizeVolunteerDbs(c),
      assignmentCount: countMap.get(c.id) ?? 0,
    }))
    .sort((a, b) => a.assignmentCount - b.assignmentCount)
    .slice(0, 3);
}

// ─── Volunteer Profiles ───────────────────────────────────────────────────────

export async function listVolunteerProfiles(clubId: string) {
  const profiles = await prisma.volunteerProfile.findMany({
    where: { clubId },
    include: {
      member: {
        include: {
          complianceRecord: { select: { dbsStatus: true, dbsExpiryDate: true } },
        },
      },
    },
    orderBy: [{ member: { lastName: 'asc' } }, { member: { firstName: 'asc' } }],
  });

  return profiles.map(normalizeVolunteerDbs);
}

export async function upsertVolunteerProfile(clubId: string, data: UpsertVolunteerProfileInput) {
  const member = await prisma.clubMember.findFirst({
    where: { id: data.memberId, clubId },
  });
  if (!member) return null;

  const profile = await prisma.volunteerProfile.upsert({
    where: { memberId: data.memberId },
    update: {
      ...(data.availableRoles !== undefined && {
        availableRoles: data.availableRoles as VolunteerRole[],
      }),
      ...(data.isAvailableGeneral !== undefined && { isAvailableGeneral: data.isAvailableGeneral }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    create: {
      clubId,
      memberId: data.memberId,
      availableRoles: (data.availableRoles ?? []) as VolunteerRole[],
      isAvailableGeneral: data.isAvailableGeneral ?? true,
      notes: data.notes,
    },
    include: {
      member: {
        include: {
          complianceRecord: { select: { dbsStatus: true, dbsExpiryDate: true } },
        },
      },
    },
  });

  return normalizeVolunteerDbs(profile);
}

// ─── iCal export ─────────────────────────────────────────────────────────────

export async function generateIcal(clubId: string): Promise<string> {
  const fixtures = await prisma.fixture.findMany({
    where: { clubId, status: { notIn: ['CANCELLED' as FixtureStatus] } },
    orderBy: { fixtureDate: 'asc' },
    include: { club: { select: { name: true } } },
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Digital Club Secretary//Fixture Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const fixture of fixtures) {
    const date = fixture.fixtureDate;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    let dtstart: string;
    let dtend: string;

    if (fixture.kickoffTime) {
      const [hh, mm] = fixture.kickoffTime.split(':');
      const startStr = `${year}${month}${day}T${hh}${mm}00Z`;
      const endDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      const ey = endDate.getUTCFullYear();
      const em = String(endDate.getUTCMonth() + 1).padStart(2, '0');
      const ed = String(endDate.getUTCDate()).padStart(2, '0');
      const ehh = String(endDate.getUTCHours()).padStart(2, '0');
      const emm = String(endDate.getUTCMinutes()).padStart(2, '0');
      dtstart = `DTSTART:${startStr}`;
      dtend = `DTEND:${ey}${em}${ed}T${ehh}${emm}00Z`;
    } else {
      dtstart = `DTSTART;VALUE=DATE:${year}${month}${day}`;
      dtend = `DTEND;VALUE=DATE:${year}${month}${day}`;
    }

    const homeAway = fixture.isHomeFixture ? 'vs' : 'at';
    const opponent = fixture.isHomeFixture ? fixture.awayTeamName : fixture.homeTeamName;
    const summary = `${fixture.club.name} ${homeAway} ${opponent}`;
    const location = fixture.venue ?? fixture.venuePostcode ?? '';
    const description = [
      fixture.competition ?? '',
      fixture.ageGroup ? `Age group: ${fixture.ageGroup}` : '',
      fixture.resultsNotes ? `Result: ${fixture.resultsNotes}` : '',
    ]
      .filter(Boolean)
      .join('\\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:dcs-fixture-${fixture.id}@digitalclubsecretary.co.uk`);
    lines.push(dtstart);
    lines.push(dtend);
    lines.push(`SUMMARY:${summary}`);
    if (location) lines.push(`LOCATION:${location}`);
    if (description) lines.push(`DESCRIPTION:${description}`);
    lines.push(`STATUS:${fixture.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE'}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
