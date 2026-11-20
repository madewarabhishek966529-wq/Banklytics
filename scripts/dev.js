import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Auto-clear any lingering processes on ports 5000 and 5173 before starting
function freePorts(ports) {
  for (const port of ports) {
    try {
      if (isWindows) {
        const out = execSync(`netstat -ano | findstr :${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        const lines = out.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid) && parseInt(pid, 10) > 0 && pid !== String(process.pid)) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            } catch (e) {
              // ignore if already closed
            }
          }
        }
      } else {
        execSync(`lsof -t -i:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      }
    } catch (e) {
      // Port was already free
    }
  }
}

console.log('Checking and releasing ports 5000 and 5173...');
freePorts([5000, 5173]);

console.log('====================================================');
console.log('   🚀 Launching Banklytics (Server + Client)       ');
console.log('====================================================');
console.log('Backend API: http://localhost:5000/api/v1');
console.log('Frontend UI: http://localhost:5173');
console.log('Press Ctrl+C to terminate both services cleanly.\n');

function runProcess(name, colorCode, args, cwd) {
  // Use a combined command string with shell: true to avoid Node DEP0190 warning
  const fullCommand = `${npmCmd} ${args.join(' ')}`;
  const proc = spawn(fullCommand, {
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

// 2. Start Server on port 5000
const serverProc = runProcess('SERVER', 36, ['run', 'dev'], path.join(rootDir, 'server'));

// 3. Start Client on port 5173
const clientProc = runProcess('CLIENT', 35, ['run', 'dev'], path.join(rootDir, 'client'));

function cleanup() {
  console.log('\nGracefully shutting down Banklytics services...');
  try {
    if (isWindows) {
      if (serverProc.pid) spawn('taskkill', ['/pid', String(serverProc.pid), '/f', '/t'], { stdio: 'ignore' });
      if (clientProc.pid) spawn('taskkill', ['/pid', String(clientProc.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      serverProc.kill('SIGINT');
      clientProc.kill('SIGINT');
    }
  } catch (e) {
    // ignore
  }
  freePorts([5000, 5173]);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
