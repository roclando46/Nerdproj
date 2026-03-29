import type { Request, Response, NextFunction } from 'express';
import * as service from './fixtures.service.js';
import type {
  ListQuery,
  CreateFixtureInput,
  UpdateFixtureInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  UpsertVolunteerProfileInput,
  AutoSuggestInput,
} from './fixtures.schema.js';

const p = (v: string | string[] | undefined): string => v as string;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export async function listFixtures(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.listFixtures(req.clubId, req.query as unknown as ListQuery);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getUpcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getUpcoming(req.clubId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createFixture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth?.payload?.sub as string | undefined;
    const fixture = await service.createFixture(req.clubId, userId, req.body as CreateFixtureInput);
    res.status(201).json(fixture);
  } catch (err) {
    next(err);
  }
}

export async function getFixture(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fixture = await service.getFixture(p(req.params['id']), req.clubId);
    if (!fixture) {
      res.status(404).json({ error: 'Not Found', message: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (err) {
    next(err);
  }
}

export async function updateFixture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const fixture = await service.updateFixture(
      p(req.params['id']),
      req.clubId,
      req.body as UpdateFixtureInput,
    );
    if (!fixture) {
      res.status(404).json({ error: 'Not Found', message: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (err) {
    next(err);
  }
}

export async function deleteFixture(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const fixture = await service.deleteFixture(p(req.params['id']), req.clubId);
    if (!fixture) {
      res.status(404).json({ error: 'Not Found', message: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (err) {
    next(err);
  }
}

export async function generateIcal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ical = await service.generateIcal(req.clubId);
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="fixtures.ics"');
    res.send(ical);
  } catch (err) {
    next(err);
  }
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function listAssignments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assignments = await service.listAssignments(p(req.params['id']), req.clubId);
    if (assignments === null) {
      res.status(404).json({ error: 'Not Found', message: 'Fixture not found' });
      return;
    }
    res.json(assignments);
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth?.payload?.sub as string | undefined;
    const result = await service.createAssignment(
      p(req.params['id']),
      req.clubId,
      userId,
      req.body as CreateAssignmentInput,
    );
    if (result === null) {
      res.status(404).json({ error: 'Not Found', message: 'Fixture or volunteer not found' });
      return;
    }
    if ('error' in result && result.error === 'DUPLICATE_ASSIGNMENT') {
      res.status(409).json({
        error: 'Conflict',
        message: 'This volunteer is already assigned to this fixture in that role',
      });
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assignment = await service.updateAssignment(
      p(req.params['assignmentId']),
      p(req.params['id']),
      req.clubId,
      req.body as UpdateAssignmentInput,
    );
    if (!assignment) {
      res.status(404).json({ error: 'Not Found', message: 'Assignment not found' });
      return;
    }
    res.json(assignment);
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.deleteAssignment(
      p(req.params['assignmentId']),
      p(req.params['id']),
      req.clubId,
    );
    if (!result) {
      res.status(404).json({ error: 'Not Found', message: 'Assignment not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function autoSuggestVolunteers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const suggestions = await service.autoSuggestVolunteers(
      p(req.params['id']),
      req.clubId,
      req.body as AutoSuggestInput,
    );
    if (suggestions === null) {
      res.status(404).json({ error: 'Not Found', message: 'Fixture not found' });
      return;
    }
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
}

// ─── Volunteer Profiles ───────────────────────────────────────────────────────

export async function listVolunteerProfiles(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profiles = await service.listVolunteerProfiles(req.clubId);
    res.json(profiles);
  } catch (err) {
    next(err);
  }
}

export async function upsertVolunteerProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await service.upsertVolunteerProfile(
      req.clubId,
      req.body as UpsertVolunteerProfileInput,
    );
    if (!profile) {
      res.status(404).json({ error: 'Not Found', message: 'Member not found' });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}
