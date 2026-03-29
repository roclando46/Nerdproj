import type { Request, Response, NextFunction } from 'express';
import * as service from './grants.service.js';
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

const p = (v: string | string[] | undefined): string => v as string;

// ─── Grants ───────────────────────────────────────────────────────────────────

export async function listGrants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.listGrants(req.clubId, req.query as unknown as ListQuery);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getGrant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const grant = await service.getGrant(p(req.params['id']), req.clubId);
    if (!grant) {
      res.status(404).json({ error: 'Not Found', message: 'Grant not found' });
      return;
    }
    res.json(grant);
  } catch (err) {
    next(err);
  }
}

export async function createGrant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const grant = await service.createGrant(req.clubId, req.body as CreateGrantInput);
    res.status(201).json(grant);
  } catch (err) {
    next(err);
  }
}

export async function updateGrant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const grant = await service.updateGrant(
      p(req.params['id']),
      req.clubId,
      req.body as UpdateGrantInput,
    );
    if (!grant) {
      res.status(404).json({ error: 'Not Found', message: 'Grant not found' });
      return;
    }
    res.json(grant);
  } catch (err) {
    next(err);
  }
}

export async function deleteGrant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.deleteGrant(p(req.params['id']), req.clubId);
    if (!result) {
      res.status(404).json({ error: 'Not Found', message: 'Grant not found' });
      return;
    }
    if ('error' in result && result.error === 'APPLICATIONS_EXIST') {
      res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete a grant that has applications',
      });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function listApplications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.listApplications(req.clubId, req.query as unknown as ListQuery);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const application = await service.getApplication(p(req.params['id']), req.clubId);
    if (!application) {
      res.status(404).json({ error: 'Not Found', message: 'Application not found' });
      return;
    }
    res.json(application);
  } catch (err) {
    next(err);
  }
}

export async function createApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth?.payload?.sub as string | undefined;
    const application = await service.createApplication(
      req.clubId,
      userId,
      req.body as CreateApplicationInput,
    );
    if (!application) {
      res.status(404).json({ error: 'Not Found', message: 'Grant not found' });
      return;
    }
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

export async function updateApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const application = await service.updateApplication(
      p(req.params['id']),
      req.clubId,
      req.body as UpdateApplicationInput,
    );
    if (!application) {
      res.status(404).json({ error: 'Not Found', message: 'Application not found' });
      return;
    }
    res.json(application);
  } catch (err) {
    next(err);
  }
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export async function listProposals(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const proposals = await service.listProposals(p(req.params['id']), req.clubId);
    if (proposals === null) {
      res.status(404).json({ error: 'Not Found', message: 'Application not found' });
      return;
    }
    res.json(proposals);
  } catch (err) {
    next(err);
  }
}

export async function createProposal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const proposal = await service.createProposal(
      p(req.params['id']),
      req.clubId,
      req.body as CreateProposalInput,
    );
    if (!proposal) {
      res.status(404).json({ error: 'Not Found', message: 'Application not found' });
      return;
    }
    res.status(201).json(proposal);
  } catch (err) {
    next(err);
  }
}

export async function updateProposal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const proposal = await service.updateProposal(
      p(req.params['proposalId']),
      p(req.params['id']),
      req.clubId,
      req.body as UpdateProposalInput,
    );
    if (!proposal) {
      res.status(404).json({ error: 'Not Found', message: 'Proposal not found' });
      return;
    }
    res.json(proposal);
  } catch (err) {
    next(err);
  }
}

export async function generateDraft(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.generateDraft(
      p(req.params['proposalId']),
      p(req.params['id']),
      req.clubId,
      req.body as GenerateProposalInput,
    );
    if (!result) {
      res.status(404).json({ error: 'Not Found', message: 'Proposal not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}
