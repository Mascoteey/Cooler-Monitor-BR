import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function connectDatabase(): Promise<void> {
  const db = getDatabase();
  await db.$connect();
  console.log('[Database] SQLite conectado');
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export async function saveSensorReading(
  sensor: string,
  value: number,
  unit: string,
  category: string,
): Promise<void> {
  const db = getDatabase();
  await db.sensorHistory.create({
    data: { sensor, value, unit, category },
  });
}

export async function getSensorHistory(
  sensor: string,
  limit = 100,
): Promise<Array<{ timestamp: Date; value: number }>> {
  const db = getDatabase();
  return db.sensorHistory.findMany({
    where: { sensor },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: { timestamp: true, value: true },
  });
}

export async function cleanupOldRecords(hours = 168): Promise<number> {
  const db = getDatabase();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const result = await db.sensorHistory.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  return result.count;
}
