import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/history', async (req: Request, res: Response) => {
  const { sensor, limit = '100', since } = req.query;
  const where: Record<string, unknown> = {};
  if (sensor) where.sensor = sensor;
  if (since) where.timestamp = { gte: new Date(Number(since)) };

  const data = await prisma.sensorHistory.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
  });
  res.json(data);
});

router.get('/alerts', async (_req: Request, res: Response) => {
  const alerts = await prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(alerts);
});

router.post('/alerts', async (req: Request, res: Response) => {
  const alert = await prisma.alert.create({ data: req.body });
  res.json(alert);
});

router.put('/alerts/:id', async (req: Request, res: Response) => {
  const alert = await prisma.alert.update({ where: { id: req.params.id }, data: req.body });
  res.json(alert);
});

router.delete('/alerts/:id', async (req: Request, res: Response) => {
  await prisma.alert.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get('/logs', async (req: Request, res: Response) => {
  const { limit = '100', level } = req.query;
  const where: Record<string, unknown> = {};
  if (level) where.level = level;
  const logs = await prisma.log.findMany({ where, orderBy: { timestamp: 'desc' }, take: Number(limit) });
  res.json(logs);
});

router.get('/settings/:userId', async (req: Request, res: Response) => {
  let settings = await prisma.settings.findUnique({ where: { userId: req.params.userId } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { userId: req.params.userId },
    });
  }
  res.json(settings);
});

router.put('/settings/:userId', async (req: Request, res: Response) => {
  const settings = await prisma.settings.upsert({
    where: { userId: req.params.userId },
    update: req.body,
    create: { userId: req.params.userId, ...req.body },
  });
  res.json(settings);
});

router.get('/benchmarks', async (_req: Request, res: Response) => {
  const benchmarks = await prisma.benchmark.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  res.json(benchmarks);
});

router.post('/benchmarks', async (req: Request, res: Response) => {
  const benchmark = await prisma.benchmark.create({ data: req.body });
  res.json(benchmark);
});
