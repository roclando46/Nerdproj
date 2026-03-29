import { prisma } from '@dcs/database';
import type { GrantStatus } from '@dcs/database';
import { env } from '../../config/env.js';
import type {
  ListQuery,
  CreateGrantInput,
  UpdateGrantInput,
  CreateApplicationInput,
  UpdateApplicationInput,
  CreateProposalInput,
  UpdateProposalInput,
  GenerateProposalInput,
} from './grants.schema.js';

const DEV_USER_ID = 'cldevadmin00000000001';

// ─── Anthropic (lazy-init) ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let anthropic: any | null = null;

async function getAnthropicClient() {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!anthropic) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

async function generateDraftContent(prompt: string): Promise<string> {
  const client = await getAnthropicClient();
  if (!client) {
    return "[MOCK DRAFT — configure ANTHROPIC_API_KEY to generate real content]\n\nThis is a placeholder draft that demonstrates the proposal structure. Once you add your Anthropic API key to the environment, Claude will generate a tailored, professional grant proposal section here based on your club's details and the specific grant requirements.";
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const block = message.content[0] as any;
  return block?.type === 'text' ? (block.text as string) : '';
}

// ─── Grants ───────────────────────────────────────────────────────────────────

export async function listGrants(clubId: string, query: ListQuery) {
  const { page, limit, status, search } = query;
  const skip = (page - 1) * limit;

  const where = {
    clubId,
    ...(status && { status: status as GrantStatus }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { funderName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [grants, total] = await Promise.all([
    prisma.grant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { closeDate: 'asc' },
      include: { _count: { select: { applications: true } } },
    }),
    prisma.grant.count({ where }),
  ]);

  return { data: grants, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getGrant(id: string, clubId: string) {
  return prisma.grant.findFirst({
    where: { id, clubId },
    include: { _count: { select: { applications: true } } },
  });
}

export async function createGrant(clubId: string, data: CreateGrantInput) {
  const { openDate, closeDate, maxAmount, minAmount, ...rest } = data;
  return prisma.grant.create({
    data: {
      clubId,
      ...rest,
      ...(openDate && { openDate: new Date(openDate) }),
      ...(closeDate && { closeDate: new Date(closeDate) }),
      ...(maxAmount !== undefined && { maxAmount }),
      ...(minAmount !== undefined && { minAmount }),
    },
    include: { _count: { select: { applications: true } } },
  });
}

export async function updateGrant(id: string, clubId: string, data: UpdateGrantInput) {
  const existing = await prisma.grant.findFirst({ where: { id, clubId } });
  if (!existing) return null;

  const { openDate, closeDate, maxAmount, minAmount, ...rest } = data;
  return prisma.grant.update({
    where: { id },
    data: {
      ...rest,
      ...(openDate !== undefined && { openDate: openDate ? new Date(openDate) : null }),
      ...(closeDate !== undefined && { closeDate: closeDate ? new Date(closeDate) : null }),
      ...(maxAmount !== undefined && { maxAmount }),
      ...(minAmount !== undefined && { minAmount }),
    },
    include: { _count: { select: { applications: true } } },
  });
}

export async function deleteGrant(id: string, clubId: string) {
  const existing = await prisma.grant.findFirst({
    where: { id, clubId },
    include: { _count: { select: { applications: true } } },
  });
  if (!existing) return null;
  if (existing._count.applications > 0) return { error: 'APPLICATIONS_EXIST' as const };

  await prisma.grant.delete({ where: { id } });
  return { id };
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function listApplications(clubId: string, query: ListQuery) {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    grant: { clubId },
    ...(status && { status: status as GrantStatus }),
  };

  const [applications, total] = await Promise.all([
    prisma.grantApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        grant: { select: { name: true, funderName: true, closeDate: true, maxAmount: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.grantApplication.count({ where }),
  ]);

  return { data: applications, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getApplication(id: string, clubId: string) {
  return prisma.grantApplication.findFirst({
    where: { id, grant: { clubId } },
    include: {
      grant: {
        select: {
          id: true,
          name: true,
          funderName: true,
          closeDate: true,
          maxAmount: true,
          description: true,
          eligibilityCriteria: true,
        },
      },
      proposals: { orderBy: { createdAt: 'asc' } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function createApplication(
  clubId: string,
  userId: string | undefined,
  data: CreateApplicationInput,
) {
  const grant = await prisma.grant.findFirst({ where: { id: data.grantId, clubId } });
  if (!grant) return null;

  return prisma.grantApplication.create({
    data: {
      grantId: data.grantId,
      createdById: userId ?? DEV_USER_ID,
      status: 'IN_PROGRESS',
      ...(data.amountRequested !== undefined && { amountRequested: data.amountRequested }),
      ...(data.internalNotes && { internalNotes: data.internalNotes }),
    },
    include: {
      grant: { select: { name: true, funderName: true, closeDate: true, maxAmount: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function updateApplication(id: string, clubId: string, data: UpdateApplicationInput) {
  const existing = await prisma.grantApplication.findFirst({
    where: { id, grant: { clubId } },
  });
  if (!existing) return null;

  const { submittedAt, decisionAt, ...rest } = data;
  return prisma.grantApplication.update({
    where: { id },
    data: {
      ...rest,
      ...(submittedAt !== undefined && { submittedAt: submittedAt ? new Date(submittedAt) : null }),
      ...(decisionAt !== undefined && { decisionAt: decisionAt ? new Date(decisionAt) : null }),
    },
    include: {
      grant: { select: { name: true, funderName: true, closeDate: true, maxAmount: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function listProposals(applicationId: string, clubId: string) {
  const application = await prisma.grantApplication.findFirst({
    where: { id: applicationId, grant: { clubId } },
  });
  if (!application) return null;

  return prisma.grantProposal.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createProposal(
  applicationId: string,
  clubId: string,
  data: CreateProposalInput,
) {
  const application = await prisma.grantApplication.findFirst({
    where: { id: applicationId, grant: { clubId } },
  });
  if (!application) return null;

  return prisma.grantProposal.create({
    data: {
      applicationId,
      sectionTitle: data.sectionTitle,
      version: 1,
    },
  });
}

export async function updateProposal(
  id: string,
  applicationId: string,
  clubId: string,
  data: UpdateProposalInput,
) {
  const existing = await prisma.grantProposal.findFirst({
    where: { id, applicationId, application: { grant: { clubId } } },
  });
  if (!existing) return null;

  const { finalContent, ...rest } = data;
  const wordCount =
    finalContent !== undefined && finalContent
      ? finalContent.trim().split(/\s+/).filter(Boolean).length
      : undefined;

  return prisma.grantProposal.update({
    where: { id },
    data: {
      ...rest,
      ...(finalContent !== undefined && { finalContent }),
      ...(wordCount !== undefined && { wordCount }),
      ...(finalContent !== undefined && { version: existing.version + 1 }),
    },
  });
}

export async function generateDraft(
  proposalId: string,
  applicationId: string,
  clubId: string,
  input: GenerateProposalInput,
) {
  const proposal = await prisma.grantProposal.findFirst({
    where: { id: proposalId, applicationId, application: { grant: { clubId } } },
    include: {
      application: {
        include: {
          grant: {
            include: {
              club: {
                select: { name: true, sport: true, county: true },
              },
            },
          },
        },
      },
    },
  });
  if (!proposal) return null;

  const { grant } = proposal.application;
  const { club } = grant;

  const prompt = `You are an expert grant writer for UK amateur sports clubs.
Club: ${club.name} (${club.sport}) in ${club.county ?? 'the UK'}
Grant: ${grant.name} by ${grant.funderName}
Description: ${grant.description ?? 'Not specified'}
Eligibility: ${grant.eligibilityCriteria ?? 'Not specified'}
Section to write: ${proposal.sectionTitle}
Extra context: ${input.context ?? 'None'}
Write a compelling ${proposal.sectionTitle} section, professional, under 400 words, UK English.`;

  const aiDraftContent = await generateDraftContent(prompt);

  const updated = await prisma.grantProposal.update({
    where: { id: proposalId },
    data: { promptUsed: prompt, aiDraftContent },
  });

  return { aiDraftContent: updated.aiDraftContent, promptUsed: updated.promptUsed };
}
