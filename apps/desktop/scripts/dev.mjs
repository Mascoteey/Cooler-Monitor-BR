import { spawn } from 'child_process';
import { createServer } from 'vite';

async function dev() {
  const viteServer = await createServer({
    configFile: './vite.config.ts',
    server: { port: 5173 },
  });
  await viteServer.listen();

  console.log('[DEV] Vite dev server on http://localhost:5173');
  console.log('[DEV] Starting Electron...');

  const electron = spawn(
    require.resolve('electron/cli.js'),
    ['.', '--dev'],
    { stdio: 'inherit', env: { ...process.env, ELECTRON_DEV: 'true' } },
  );

  electron.on('close', () => {
    viteServer.close();
    process.exit();
  });
}

dev().catch(console.error);
