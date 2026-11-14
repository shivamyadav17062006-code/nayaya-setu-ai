import { spawn } from 'child_process';

console.log('Starting three services via `npm run dev:full`...');

const proc = spawn('npm', ['run', 'dev:full'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false,
});

let stdout = '';
proc.stdout.on('data', (d) => {
  const line = d.toString();
  stdout += line;
  process.stdout.write(line);
});

proc.stderr.on('data', (d) => {
  process.stderr.write(d.toString());
});

async function checkHealth(url, timeoutMs = 2000) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

async function run() {
  const maxAttempts = 30;
  let frontendHealth = null;
  let backendHealth = null;
  let aiHealth = null;

  console.log('\nWaiting for all three services to be healthy...');

  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));

    if (!aiHealth) {
      aiHealth = await checkHealth('http://localhost:8001/health');
    }
    if (!backendHealth) {
      backendHealth = await checkHealth('http://localhost:8000/health');
    }
    if (!frontendHealth) {
      frontendHealth = await checkHealth('http://localhost:3000/health');
    }

    console.log(
      `[Attempt ${i}/${maxAttempts}] Health: AI=${Boolean(aiHealth)}, Backend=${Boolean(backendHealth)}, Frontend=${Boolean(frontendHealth)}`
    );

    if (aiHealth && backendHealth && frontendHealth) {
      break;
    }
  }

  console.log('\n=============================================');
  console.log('ACTUAL THREE-SERVICE HEALTH RESULTS:');
  console.log('=============================================');
  console.log('1. AI Engine (:8001):', JSON.stringify(aiHealth, null, 2));
  console.log('\n2. Backend API (:8000):', JSON.stringify(backendHealth, null, 2));
  console.log('\n3. Frontend (:3000):', JSON.stringify(frontendHealth, null, 2));
  console.log('=============================================\n');

  if (!aiHealth || !backendHealth || !frontendHealth) {
    console.error('❌ Failed: One or more services did not become healthy within the timeout window.');
    proc.kill('SIGINT');
    process.exit(1);
  }

  console.log('✅ All three services verified healthy! Sending SIGINT for graceful shutdown test...');
  proc.kill('SIGINT');

  await new Promise((r) => setTimeout(r, 2000));
  console.log('Verification completed successfully.');
  process.exit(0);
}

run();
