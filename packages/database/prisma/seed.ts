import {
  PrismaClient,
  ClubSport,
  UserRole,
  DBSStatus,
  TrainingType,
  GrantStatus,
  FixtureStatus,
  VolunteerRole,
} from '@prisma/client';

const prisma = new PrismaClient();

// Fixed IDs so dev API middleware can reference a known club
const DEV_CLUB_ID = 'cldevclub0000000000001';
const DEV_ADMIN_ID = 'cldevadmin00000000001';
const DEV_MEMBER_1_ID = 'cldevmember000000001';
const DEV_MEMBER_2_ID = 'cldevmember000000002';
const DEV_MEMBER_3_ID = 'cldevmember000000003';

// Grant IDs
const DEV_GRANT_1_ID = 'cldevgrant00000000001';
const DEV_GRANT_2_ID = 'cldevgrant00000000002';
const DEV_APP_1_ID = 'cldevapplication0001';
const DEV_PROPOSAL_1_ID = 'cldevproposal000001';
const DEV_PROPOSAL_2_ID = 'cldevproposal000002';

// Fixture IDs
const DEV_FIXTURE_1_ID = 'cldevfixture0000001';
const DEV_FIXTURE_2_ID = 'cldevfixture0000002';
const DEV_FIXTURE_3_ID = 'cldevfixture0000003';
const DEV_FIXTURE_4_ID = 'cldevfixture0000004';

// Volunteer profile IDs
const DEV_VP_1_ID = 'cldevvolprof000001';
const DEV_VP_2_ID = 'cldevvolprof000002';
const DEV_VP_3_ID = 'cldevvolprof000003';

// Assignment IDs
const DEV_ASS_1_ID = 'cldevassignment0001';
const DEV_ASS_2_ID = 'cldevassignment0002';

async function main(): Promise<void> {
  console.warn('Seeding database...');

  // ── Club ───────────────────────────────────────────────────────────────────
  const club = await prisma.club.upsert({
    where: { slug: 'durham-cricket-cc' },
    update: {},
    create: {
      id: DEV_CLUB_ID,
      name: 'Durham Cricket CC',
      slug: 'durham-cricket-cc',
      sport: ClubSport.CRICKET,
      leagueName: 'Durham Cricket League',
      countyName: 'Durham',
      addressLine1: '1 Cricket Ground Lane',
      city: 'Durham',
      county: 'County Durham',
      postcode: 'DH1 3AB',
      welfareOfficerName: 'Jane Smith',
      welfareOfficerEmail: 'welfare@durhamcricketcc.co.uk',
    },
  });

  console.warn(`Club: ${club.name} (${club.id})`);

  // ── Admin user ─────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@durhamcricketcc.co.uk' },
    update: {},
    create: {
      id: DEV_ADMIN_ID,
      auth0Id: 'auth0|dev_admin_placeholder',
      email: 'admin@durhamcricketcc.co.uk',
      firstName: 'Ryan',
      lastName: 'Admin',
      role: UserRole.CLUB_ADMIN,
      clubId: club.id,
    },
  });

  // ── Members ────────────────────────────────────────────────────────────────
  const [john, jane, bob] = await Promise.all([
    prisma.clubMember.upsert({
      where: { clubId_email: { clubId: club.id, email: 'john.smith@example.com' } },
      update: {},
      create: {
        id: DEV_MEMBER_1_ID,
        clubId: club.id,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        membershipNumber: 'DCC-001',
        isActive: true,
      },
    }),
    prisma.clubMember.upsert({
      where: { clubId_email: { clubId: club.id, email: 'jane.doe@example.com' } },
      update: {},
      create: {
        id: DEV_MEMBER_2_ID,
        clubId: club.id,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        membershipNumber: 'DCC-002',
        isActive: true,
      },
    }),
    prisma.clubMember.upsert({
      where: { clubId_email: { clubId: club.id, email: 'bob.wilson@example.com' } },
      update: {},
      create: {
        id: DEV_MEMBER_3_ID,
        clubId: club.id,
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        membershipNumber: 'DCC-003',
        isActive: true,
      },
    }),
  ]);

  console.warn(`Members: ${john.firstName}, ${jane.firstName}, ${bob.firstName}`);

  // ── DBS Records ────────────────────────────────────────────────────────────
  // John — valid DBS expiring in ~6 months
  await prisma.dBSRecord.upsert({
    where: { id: 'cldevdbs000000001' },
    update: {},
    create: {
      id: 'cldevdbs000000001',
      clubId: club.id,
      memberId: john.id,
      checkDate: new Date('2023-01-15'),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      status: DBSStatus.VALID,
      checkType: 'ENHANCED',
      issuedBy: 'DBS Update Service',
    },
  });

  // Jane — DBS expiring within 30 days (alert)
  await prisma.dBSRecord.upsert({
    where: { id: 'cldevdbs000000002' },
    update: {},
    create: {
      id: 'cldevdbs000000002',
      clubId: club.id,
      memberId: jane.id,
      checkDate: new Date('2021-03-10'),
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      status: DBSStatus.VALID,
      checkType: 'ENHANCED',
      issuedBy: 'DBS Update Service',
    },
  });

  // Bob — no DBS (pending)
  console.warn('DBS records seeded');

  // ── Training Records ───────────────────────────────────────────────────────
  // John — valid Safe Hands
  await prisma.trainingRecord.upsert({
    where: { id: 'cldevtraining00001' },
    update: {},
    create: {
      id: 'cldevtraining00001',
      clubId: club.id,
      memberId: john.id,
      trainingType: TrainingType.SAFE_HANDS,
      completedAt: new Date('2023-06-01'),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      provider: 'ECB',
      certificateRef: 'SH-2023-00123',
      isValid: true,
    },
  });

  // Jane — expired Safe Hands (alert)
  await prisma.trainingRecord.upsert({
    where: { id: 'cldevtraining00002' },
    update: {},
    create: {
      id: 'cldevtraining00002',
      clubId: club.id,
      memberId: jane.id,
      trainingType: TrainingType.SAFE_HANDS,
      completedAt: new Date('2021-05-15'),
      expiryDate: new Date('2023-05-15'),
      provider: 'ECB',
      certificateRef: 'SH-2021-00456',
      isValid: false,
    },
  });

  // John — First Aid
  await prisma.trainingRecord.upsert({
    where: { id: 'cldevtraining00003' },
    update: {},
    create: {
      id: 'cldevtraining00003',
      clubId: club.id,
      memberId: john.id,
      trainingType: TrainingType.FIRST_AID,
      completedAt: new Date('2024-02-10'),
      expiryDate: new Date(Date.now() + 700 * 24 * 60 * 60 * 1000),
      provider: 'British Red Cross',
      isValid: true,
    },
  });

  console.warn('Training records seeded');

  // ── Compliance Records (recomputed) ───────────────────────────────────────
  // John: VALID DBS + valid Safe Hands → COMPLIANT
  await prisma.complianceRecord.upsert({
    where: { memberId: john.id },
    update: {},
    create: {
      clubId: club.id,
      memberId: john.id,
      overallStatus: 'COMPLIANT',
      dbsStatus: DBSStatus.VALID,
      dbsExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      safeHandsValid: true,
      safeHandsExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Jane: VALID DBS (expiring soon) + expired Safe Hands → COMPLIANT (DBS still valid)
  await prisma.complianceRecord.upsert({
    where: { memberId: jane.id },
    update: {},
    create: {
      clubId: club.id,
      memberId: jane.id,
      overallStatus: 'COMPLIANT',
      dbsStatus: DBSStatus.VALID,
      dbsExpiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      safeHandsValid: false,
      safeHandsExpiry: new Date('2023-05-15'),
    },
  });

  // Bob: no DBS → PENDING
  await prisma.complianceRecord.upsert({
    where: { memberId: bob.id },
    update: {},
    create: {
      clubId: club.id,
      memberId: bob.id,
      overallStatus: 'PENDING',
      dbsStatus: DBSStatus.PENDING,
      safeHandsValid: false,
    },
  });

  console.warn('Compliance records seeded');

  // ── Grants ─────────────────────────────────────────────────────────────────
  const now = new Date();

  await prisma.grant.upsert({
    where: { id: DEV_GRANT_1_ID },
    update: {},
    create: {
      id: DEV_GRANT_1_ID,
      clubId: club.id,
      name: 'Sport England Small Grants',
      funderName: 'Sport England',
      funderUrl: 'https://www.sportengland.org/funding-and-campaigns/small-grants',
      description:
        'Grants of up to £10,000 for community sport projects that help more people become and stay active.',
      maxAmount: 10000,
      eligibilityCriteria:
        'Open to community sport organisations in England. Must demonstrate clear impact on local participation.',
      sportFocus: ['CRICKET', 'COMMUNITY'],
      tags: ['community', 'participation', 'small-grant'],
      status: GrantStatus.IDENTIFIED,
      closeDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      isRecurring: true,
    },
  });

  await prisma.grant.upsert({
    where: { id: DEV_GRANT_2_ID },
    update: {},
    create: {
      id: DEV_GRANT_2_ID,
      clubId: club.id,
      name: 'ECB Facilities Fund',
      funderName: 'England & Wales Cricket Board',
      funderUrl: 'https://www.ecb.co.uk/play/facilities',
      description: 'Funding to improve cricket facilities and infrastructure at community clubs.',
      maxAmount: 25000,
      eligibilityCriteria:
        'Affiliated ECB clubs in good standing. Project must improve playing facilities.',
      sportFocus: ['CRICKET'],
      tags: ['facilities', 'infrastructure', 'ecb'],
      status: GrantStatus.RESEARCHING,
      closeDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
      isRecurring: false,
    },
  });

  // Grant Application
  await prisma.grantApplication.upsert({
    where: { id: DEV_APP_1_ID },
    update: {},
    create: {
      id: DEV_APP_1_ID,
      grantId: DEV_GRANT_1_ID,
      createdById: DEV_ADMIN_ID,
      status: GrantStatus.IN_PROGRESS,
      amountRequested: 8500,
      internalNotes: 'Applying for new practice nets and coaching equipment.',
    },
  });

  // Proposals
  await prisma.grantProposal.upsert({
    where: { id: DEV_PROPOSAL_1_ID },
    update: {},
    create: {
      id: DEV_PROPOSAL_1_ID,
      applicationId: DEV_APP_1_ID,
      sectionTitle: 'Project Description',
      finalContent:
        'Durham Cricket CC proposes to install two new practice nets and purchase updated coaching equipment to improve training facilities for our 120 active members. The project will directly increase participation by enabling year-round training sessions regardless of pitch conditions.',
      wordCount: 40,
      version: 1,
      isApproved: false,
    },
  });

  await prisma.grantProposal.upsert({
    where: { id: DEV_PROPOSAL_2_ID },
    update: {},
    create: {
      id: DEV_PROPOSAL_2_ID,
      applicationId: DEV_APP_1_ID,
      sectionTitle: 'Community Impact',
      aiDraftContent:
        "[MOCK DRAFT — configure ANTHROPIC_API_KEY to generate real content]\n\nDurham Cricket CC is a cornerstone of the local community, providing sporting opportunities for over 120 members ranging from juniors aged 8 through to veterans. Our club serves one of the most economically diverse areas of County Durham, with 35% of our junior members qualifying for free school meals.\n\nThe proposed facility improvements will directly benefit the community by enabling us to expand our junior development programme from 45 to 75 participants, introduce a new women's section, and extend our coaching sessions into the winter months for the first time in the club's 60-year history.",
      finalContent: null,
      wordCount: null,
      version: 1,
      isApproved: false,
    },
  });

  console.warn('Grants seeded');

  // ── Fixtures ───────────────────────────────────────────────────────────────
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  await prisma.fixture.upsert({
    where: { id: DEV_FIXTURE_1_ID },
    update: {},
    create: {
      id: DEV_FIXTURE_1_ID,
      clubId: club.id,
      createdById: DEV_ADMIN_ID,
      sport: ClubSport.CRICKET,
      fixtureDate: nextWeek,
      kickoffTime: '13:00',
      homeTeamName: 'Durham Cricket CC',
      awayTeamName: 'Sunderland CC',
      isHomeFixture: true,
      venue: 'Durham Cricket Ground',
      ageGroup: '1st XI',
      competition: 'Durham Saturday League Div 2',
      status: FixtureStatus.SCHEDULED,
    },
  });

  await prisma.fixture.upsert({
    where: { id: DEV_FIXTURE_2_ID },
    update: {},
    create: {
      id: DEV_FIXTURE_2_ID,
      clubId: club.id,
      createdById: DEV_ADMIN_ID,
      sport: ClubSport.CRICKET,
      fixtureDate: twoWeeks,
      kickoffTime: '13:00',
      homeTeamName: 'Durham Cricket CC',
      awayTeamName: 'Gateshead CC',
      isHomeFixture: true,
      venue: 'Durham Cricket Ground',
      ageGroup: '1st XI',
      competition: 'Durham Saturday League Div 2',
      status: FixtureStatus.CONFIRMED,
    },
  });

  await prisma.fixture.upsert({
    where: { id: DEV_FIXTURE_3_ID },
    update: {},
    create: {
      id: DEV_FIXTURE_3_ID,
      clubId: club.id,
      createdById: DEV_ADMIN_ID,
      sport: ClubSport.CRICKET,
      fixtureDate: lastWeek,
      kickoffTime: '13:00',
      homeTeamName: 'Bishop Auckland CC',
      awayTeamName: 'Durham Cricket CC',
      isHomeFixture: false,
      ageGroup: '1st XI',
      competition: 'Durham Saturday League Div 2',
      status: FixtureStatus.COMPLETED,
      resultsNotes: 'Won by 45 runs',
    },
  });

  await prisma.fixture.upsert({
    where: { id: DEV_FIXTURE_4_ID },
    update: {},
    create: {
      id: DEV_FIXTURE_4_ID,
      clubId: club.id,
      createdById: DEV_ADMIN_ID,
      sport: ClubSport.CRICKET,
      fixtureDate: threeWeeks,
      kickoffTime: '13:00',
      homeTeamName: 'Newcastle CC',
      awayTeamName: 'Durham Cricket CC',
      isHomeFixture: false,
      ageGroup: '1st XI',
      competition: 'Durham Saturday League Div 2',
      status: FixtureStatus.SCHEDULED,
    },
  });

  console.warn('Fixtures seeded');

  // ── Volunteer Profiles ─────────────────────────────────────────────────────
  await prisma.volunteerProfile.upsert({
    where: { id: DEV_VP_1_ID },
    update: {},
    create: {
      id: DEV_VP_1_ID,
      clubId: club.id,
      memberId: john.id,
      availableRoles: [VolunteerRole.SCORER, VolunteerRole.FIRST_AIDER],
      isAvailableGeneral: true,
    },
  });

  await prisma.volunteerProfile.upsert({
    where: { id: DEV_VP_2_ID },
    update: {},
    create: {
      id: DEV_VP_2_ID,
      clubId: club.id,
      memberId: jane.id,
      availableRoles: [
        VolunteerRole.UMPIRE,
        VolunteerRole.SAFEGUARDING_OFFICER,
        VolunteerRole.TEA_DUTY,
      ],
      isAvailableGeneral: true,
    },
  });

  await prisma.volunteerProfile.upsert({
    where: { id: DEV_VP_3_ID },
    update: {},
    create: {
      id: DEV_VP_3_ID,
      clubId: club.id,
      memberId: bob.id,
      availableRoles: [VolunteerRole.GROUNDSPERSON, VolunteerRole.TRANSPORT],
      isAvailableGeneral: true,
    },
  });

  // ── Volunteer Assignments ──────────────────────────────────────────────────
  await prisma.volunteerAssignment.upsert({
    where: { id: DEV_ASS_1_ID },
    update: {},
    create: {
      id: DEV_ASS_1_ID,
      fixtureId: DEV_FIXTURE_1_ID,
      volunteerId: DEV_VP_1_ID,
      assignedById: DEV_ADMIN_ID,
      role: VolunteerRole.SCORER,
    },
  });

  await prisma.volunteerAssignment.upsert({
    where: { id: DEV_ASS_2_ID },
    update: {},
    create: {
      id: DEV_ASS_2_ID,
      fixtureId: DEV_FIXTURE_1_ID,
      volunteerId: DEV_VP_2_ID,
      assignedById: DEV_ADMIN_ID,
      role: VolunteerRole.UMPIRE,
      confirmedAt: now,
    },
  });

  console.warn('Volunteer profiles and assignments seeded');
  console.warn('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
