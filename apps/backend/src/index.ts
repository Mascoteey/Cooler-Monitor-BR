import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { router as apiRouter } from './routes';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  ws.send(JSON.stringify({ type: 'welcome', message: 'COOLER MONITOR BR Backend' }));

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'hardware-data') {
        await prisma.sensorHistory.create({
          data: {
            sensor: msg.sensor || 'unknown',
            value: msg.value || 0,
            unit: msg.unit || '',
            category: msg.category || 'general',
          },
        });
      }
    } catch { /* ignore */ }
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

server.listen(PORT, () => {
  console.log(`[BACKEND] COOLER MONITOR BR backend on http://localhost:${PORT}`);
  console.log(`[BACKEND] WebSocket on ws://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

export { app, server, wss, prisma };
