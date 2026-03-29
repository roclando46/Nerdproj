-- CreateEnum
CREATE TYPE "ClubSport" AS ENUM ('CRICKET', 'RUGBY', 'BOTH');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CLUB_ADMIN', 'CLUB_OFFICIAL', 'CLUB_MEMBER');

-- CreateEnum
CREATE TYPE "DBSStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VALID', 'EXPIRED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('SAFE_HANDS', 'WELFARE_OFFICER', 'FIRST_AID', 'COACHING_LEVEL_1', 'COACHING_LEVEL_2', 'DBS_AWARENESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('IDENTIFIED', 'RESEARCHING', 'IN_PROGRESS', 'SUBMITTED', 'AWARDED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'POSTPONED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VolunteerRole" AS ENUM ('SCORER', 'UMPIRE', 'FIRST_AIDER', 'TRANSPORT', 'TEA_DUTY', 'GROUNDSPERSON', 'SAFEGUARDING_OFFICER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW_SENSITIVE', 'EXPORT');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sport" "ClubSport" NOT NULL,
    "leagueName" TEXT,
    "countyName" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "stripeCustomerId" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "county" TEXT,
    "postcode" TEXT,
    "welfareOfficerName" TEXT,
    "welfareOfficerEmail" TEXT,
    "ecbClubId" TEXT,
    "rflClubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "auth0Id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLUB_MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clubId" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isUnder18" BOOLEAN NOT NULL DEFAULT false,
    "membershipNumber" TEXT,
    "joinedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "overallStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "dbsStatus" "DBSStatus" NOT NULL DEFAULT 'PENDING',
    "dbsExpiryDate" TIMESTAMP(3),
    "safeHandsValid" BOOLEAN NOT NULL DEFAULT false,
    "safeHandsExpiry" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "lastReviewedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DBSRecord" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "certificateNumberEncrypted" TEXT,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" "DBSStatus" NOT NULL DEFAULT 'PENDING',
    "checkType" TEXT NOT NULL DEFAULT 'ENHANCED',
    "issuedBy" TEXT,
    "documentUrl" TEXT,
    "uploadedById" TEXT,
    "notes" TEXT,
    "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DBSRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainingType" "TrainingType" NOT NULL,
    "customTypeName" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "provider" TEXT,
    "certificateRef" TEXT,
    "documentUrl" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "funderName" TEXT NOT NULL,
    "funderUrl" TEXT,
    "description" TEXT,
    "maxAmount" DECIMAL(10,2),
    "minAmount" DECIMAL(10,2),
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "eligibilityCriteria" TEXT,
    "sportFocus" TEXT[],
    "tags" TEXT[],
    "status" "GrantStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantApplication" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "GrantStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "amountRequested" DECIMAL(10,2),
    "amountAwarded" DECIMAL(10,2),
    "submittedAt" TIMESTAMP(3),
    "decisionAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantProposal" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "promptUsed" TEXT,
    "aiDraftContent" TEXT,
    "finalContent" TEXT,
    "wordCount" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrantProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sport" "ClubSport" NOT NULL,
    "fixtureDate" TIMESTAMP(3) NOT NULL,
    "kickoffTime" TEXT,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "isHomeFixture" BOOLEAN NOT NULL DEFAULT true,
    "venue" TEXT,
    "venuePostcode" TEXT,
    "status" "FixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "ageGroup" TEXT,
    "competition" TEXT,
    "oppositionContact" TEXT,
    "resultsNotes" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerProfile" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "availableRoles" "VolunteerRole"[],
    "isAvailableGeneral" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerAssignment" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "role" "VolunteerRole" NOT NULL,
    "customRoleName" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changedFields" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Club_stripeCustomerId_key" ON "Club"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Club_slug_idx" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "User"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_auth0Id_idx" ON "User"("auth0Id");

-- CreateIndex
CREATE INDEX "User_clubId_idx" ON "User"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_userId_key" ON "ClubMember"("userId");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_idx" ON "ClubMember"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_email_key" ON "ClubMember"("clubId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRecord_memberId_key" ON "ComplianceRecord"("memberId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_clubId_idx" ON "ComplianceRecord"("clubId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_dbsStatus_idx" ON "ComplianceRecord"("dbsStatus");

-- CreateIndex
CREATE INDEX "ComplianceRecord_dbsExpiryDate_idx" ON "ComplianceRecord"("dbsExpiryDate");

-- CreateIndex
CREATE INDEX "DBSRecord_clubId_idx" ON "DBSRecord"("clubId");

-- CreateIndex
CREATE INDEX "DBSRecord_memberId_idx" ON "DBSRecord"("memberId");

-- CreateIndex
CREATE INDEX "DBSRecord_status_idx" ON "DBSRecord"("status");

-- CreateIndex
CREATE INDEX "DBSRecord_expiryDate_idx" ON "DBSRecord"("expiryDate");

-- CreateIndex
CREATE INDEX "TrainingRecord_clubId_idx" ON "TrainingRecord"("clubId");

-- CreateIndex
CREATE INDEX "TrainingRecord_memberId_idx" ON "TrainingRecord"("memberId");

-- CreateIndex
CREATE INDEX "TrainingRecord_trainingType_idx" ON "TrainingRecord"("trainingType");

-- CreateIndex
CREATE INDEX "TrainingRecord_expiryDate_idx" ON "TrainingRecord"("expiryDate");

-- CreateIndex
CREATE INDEX "Grant_clubId_idx" ON "Grant"("clubId");

-- CreateIndex
CREATE INDEX "Grant_closeDate_idx" ON "Grant"("closeDate");

-- CreateIndex
CREATE INDEX "Grant_status_idx" ON "Grant"("status");

-- CreateIndex
CREATE INDEX "GrantApplication_grantId_idx" ON "GrantApplication"("grantId");

-- CreateIndex
CREATE INDEX "GrantApplication_status_idx" ON "GrantApplication"("status");

-- CreateIndex
CREATE INDEX "GrantApplication_createdById_idx" ON "GrantApplication"("createdById");

-- CreateIndex
CREATE INDEX "GrantProposal_applicationId_idx" ON "GrantProposal"("applicationId");

-- CreateIndex
CREATE INDEX "Fixture_clubId_idx" ON "Fixture"("clubId");

-- CreateIndex
CREATE INDEX "Fixture_fixtureDate_idx" ON "Fixture"("fixtureDate");

-- CreateIndex
CREATE INDEX "Fixture_status_idx" ON "Fixture"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_memberId_key" ON "VolunteerProfile"("memberId");

-- CreateIndex
CREATE INDEX "VolunteerProfile_clubId_idx" ON "VolunteerProfile"("clubId");

-- CreateIndex
CREATE INDEX "VolunteerAssignment_fixtureId_idx" ON "VolunteerAssignment"("fixtureId");

-- CreateIndex
CREATE INDEX "VolunteerAssignment_volunteerId_idx" ON "VolunteerAssignment"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerAssignment_fixtureId_volunteerId_role_key" ON "VolunteerAssignment"("fixtureId", "volunteerId", "role");

-- CreateIndex
CREATE INDEX "AuditLog_clubId_idx" ON "AuditLog"("clubId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DBSRecord" ADD CONSTRAINT "DBSRecord_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DBSRecord" ADD CONSTRAINT "DBSRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantApplication" ADD CONSTRAINT "GrantApplication_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantApplication" ADD CONSTRAINT "GrantApplication_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrantProposal" ADD CONSTRAINT "GrantProposal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "GrantApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
