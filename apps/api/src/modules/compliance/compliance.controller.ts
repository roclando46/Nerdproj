import type { Request, Response, NextFunction } from 'express';
import * as service from './compliance.service.js';
import type {
  CreateDBSRecordInput,
  UpdateDBSRecordInput,
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
  ListQuery,
} from './compliance.schema.js';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getDashboard(req.clubId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── Members (dropdown) ───────────────────────────────────────────────────────

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.listMembers(req.clubId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── DBS Records ──────────────────────────────────────────────────────────────

export async function listDBSRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.listDBSRecords(req.clubId, req.query as unknown as ListQuery);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getDBSRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await service.getDBSRecord(req.params['id'] as string, req.clubId);
    if (!record) {
      res.status(404).json({ error: 'Not Found', message: 'DBS record not found' });
      return;
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
}

export async function createDBSRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth?.payload?.sub as string | undefined;
    const record = await service.createDBSRecord(
      req.clubId,
      req.body as CreateDBSRecordInput,
      userId,
    );
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}

export async function updateDBSRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await service.updateDBSRecord(
      req.params['id'] as string,
      req.clubId,
      req.body as UpdateDBSRecordInput,
    );
    if (!record) {
      res.status(404).json({ error: 'Not Found', message: 'DBS record not found' });
      return;
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
}

// ─── Training Records ─────────────────────────────────────────────────────────

export async function listTrainingRecords(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await service.listTrainingRecords(req.clubId, req.query as unknown as ListQuery);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getTrainingRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await service.getTrainingRecord(req.params['id'] as string, req.clubId);
    if (!record) {
      res.status(404).json({ error: 'Not Found', message: 'Training record not found' });
      return;
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
}

export async function createTrainingRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await service.createTrainingRecord(
      req.clubId,
      req.body as CreateTrainingRecordInput,
    );
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}

export async function updateTrainingRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const record = await service.updateTrainingRecord(
      req.params['id'] as string,
      req.clubId,
      req.body as UpdateTrainingRecordInput,
    );
    if (!record) {
      res.status(404).json({ error: 'Not Found', message: 'Training record not found' });
      return;
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
}

export async function deleteTrainingRecord(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.deleteTrainingRecord(req.params['id'] as string, req.clubId);
    if (!result) {
      res.status(404).json({ error: 'Not Found', message: 'Training record not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getAlerts(req.clubId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportCompliance(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  // CSV export — implementation pending (Phase 2)
  res.json({ message: 'CSV export coming soon' });
}

// ─── ECB Safe Hands stub ──────────────────────────────────────────────────────

export async function ecbSync(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  res.json({
    success: true,
    message: 'ECB Safe Hands sync — stub (real API integration pending)',
    synced: 0,
  });
}
