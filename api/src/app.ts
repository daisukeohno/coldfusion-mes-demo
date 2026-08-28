import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import type { InspectionRepository } from './repositories/inspectionRepository';
import { InspectionValidationError } from './services/inspectionJudgment';
import { InspectionService } from './services/inspectionService';

export function createApp(repository: InspectionRepository) {
  const app = express();
  const service = new InspectionService(repository);

  app.use(express.json());

  app.post(
    '/api/inspections',
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const result = await service.create(request.body);
        response.status(201).json({
          ...result,
          message: `検査結果を登録しました。判定は ${result.hantei} です。`,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/inspections',
    async (request: Request, response: Response, next: NextFunction) => {
      try {
        const rows = await repository.findAll({
          shiji_no:
            typeof request.query.shiji_no === 'string'
              ? request.query.shiji_no
              : undefined,
          hantei:
            typeof request.query.hantei === 'string'
              ? request.query.hantei
              : undefined,
        });
        response.json(rows);
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/inspections/defect-summary',
    async (_request: Request, response: Response, next: NextFunction) => {
      try {
        response.json(await repository.getDefectSummary());
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    '/api/orders',
    async (_request: Request, response: Response, next: NextFunction) => {
      try {
        response.json(await repository.getOrders());
      } catch (error) {
        next(error);
      }
    },
  );

  app.use(
    (
      error: Error,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      if (error instanceof InspectionValidationError) {
        response.status(400).json({ error: error.message });
        return;
      }

      console.error(error);
      response.status(500).json({ error: 'サーバーエラーが発生しました。' });
    },
  );

  return app;
}
