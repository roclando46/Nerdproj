import { PrismaClient, ClubSport, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.warn('Seeding database...');

  // Create demo club
  const club = await prisma.club.upsert({
    where: { slug: 'durham-cricket-cc' },
    update: {},
    create: {
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

  console.warn(`Created club: ${club.name} (${club.id})`);

  // Create demo admin user
  // Note: auth0Id will need updating once Auth0 is configured
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@durhamcricketcc.co.uk' },
    update: {},
    create: {
      auth0Id: 'auth0|demo_admin_placeholder',
      email: 'admin@durhamcricketcc.co.uk',
      firstName: 'Ryan',
      lastName: 'Admin',
      role: UserRole.CLUB_ADMIN,
      clubId: club.id,
    },
  });

  console.warn(`Created admin user: ${adminUser.email}`);

  // Create a few demo members
  const members = await Promise.all([
    prisma.clubMember.upsert({
      where: { clubId_email: { clubId: club.id, email: 'john.smith@example.com' } },
      update: {},
      create: {
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
        clubId: club.id,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        membershipNumber: 'DCC-002',
        isActive: true,
      },
    }),
  ]);

  console.warn(`Created ${members.length} demo members`);
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
