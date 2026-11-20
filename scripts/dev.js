import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('====================================================');
console.log('   🚀 Launching Banklytics (Server + Client)       ');
console.log('====================================================');
console.log('Backend API: http://localhost:5000/api/v1');
console.log('Frontend UI: http://localhost:5173');
console.log('Press Ctrl+C to terminate both services cleanly.\n');

function runProcess(name, prefix, colorCode, args, cwd) {
  const proc = spawn(npmCmd, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  const formatOutput = (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        console.log(`\x1b[${colorCode}m[${name}]\x1b[0m ${line}`);
      }
    }
  };

  proc.stdout.on('data', formatOutput);
  proc.stderr.on('data', formatOutput);

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\x1b[${colorCode}m[${name}]\x1b[0m Exited with code ${code}`);
    }
  });

  return proc;
}

// 1. Start Server
const serverProc = runProcess('SERVER', '36', 36, ['run', 'dev'], path.join(rootDir, 'server'));

// 2. Start Client
const clientProc = runProcess('CLIENT', '35', 35, ['run', 'dev'], path.join(rootDir, 'client'));

function cleanup() {
  console.log('\nGracefully shutting down Banklytics services...');
  try {
    if (isWindows) {
      if (serverProc.pid) spawn('taskkill', ['/pid', serverProc.pid, '/f', '/t']);
      if (clientProc.pid) spawn('taskkill', ['/pid', clientProc.pid, '/f', '/t']);
    } else {
      serverProc.kill('SIGINT');
      clientProc.kill('SIGINT');
    }
  } catch (e) {
    // ignore
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
