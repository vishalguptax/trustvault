#!/usr/bin/env node

/**
 * TrustVault Dev CLI
 *
 * Launches all services in separate Windows Terminal tabs with a
 * status dashboard in the main terminal.
 *
 * Usage:
 *   node tools/dev.mjs            # Start all 3 services
 *   node tools/dev.mjs --web      # Web portal only
 *   node tools/dev.mjs --mobile   # Mobile wallet only
 *   node tools/dev.mjs --api      # Backend API only
 *
 * Runtime commands:
 *   d / dash   — re-print the status dashboard
 *   r / restart <service> — restart a service (api|web|mobile)
 *   q / quit   — stop all services and exit
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Service registry
// ---------------------------------------------------------------------------

const SERVICES = {
  api: {
    name: 'API Server',
    pkg: '@trustvault/api',
    port: 8000,
    cmd: 'dev',
    color: 'green',
    tabColor: '#10B981',
  },
  web: {
    name: 'Web Dashboard',
    pkg: '@trustvault/web',
    port: 3000,
    cmd: 'dev',
    color: 'cyan',
    tabColor: '#14B8A6',
  },
  mobile: {
    name: 'Mobile Wallet',
    pkg: '@trustvault/mobile',
    port: 5000,
    cmd: 'dev',
    color: 'yellow',
    tabColor: '#F59E0B',
  },
};

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const ESC = '\x1b';
const c = {
  reset:     `${ESC}[0m`,
  bold:      `${ESC}[1m`,
  dim:       `${ESC}[2m`,
  cyan:      `${ESC}[36m`,
  green:     `${ESC}[32m`,
  yellow:    `${ESC}[33m`,
  red:       `${ESC}[31m`,
  magenta:   `${ESC}[35m`,
  gray:      `${ESC}[90m`,
  white:     `${ESC}[97m`,
  clearLine: `${ESC}[2K`,
  hide:      `${ESC}[?25l`,
  show:      `${ESC}[?25h`,
};

const colorFn = {
  green:   (s) => `${c.green}${s}${c.reset}`,
  cyan:    (s) => `${c.cyan}${s}${c.reset}`,
  yellow:  (s) => `${c.yellow}${s}${c.reset}`,
  red:     (s) => `${c.red}${s}${c.reset}`,
  magenta: (s) => `${c.magenta}${s}${c.reset}`,
};

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

class Spinner {
  constructor(text) {
    this.text = text;
    this.frame = 0;
    this.interval = null;
  }

  start() {
    process.stdout.write(c.hide);
    this.interval = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length];
      process.stdout.write(`${c.clearLine}\r  ${c.cyan}${frame}${c.reset} ${this.text}`);
      this.frame++;
    }, 80);
    return this;
  }

  succeed(text) {
    this.stop();
    console.log(`${c.clearLine}\r  ${c.green}${c.bold}✔${c.reset} ${text}`);
  }

  fail(text) {
    this.stop();
    console.log(`${c.clearLine}\r  ${c.red}${c.bold}✖${c.reset} ${text}`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write(`${c.clearLine}\r${c.show}`);
  }
}

// ---------------------------------------------------------------------------
// Status tracking
// ---------------------------------------------------------------------------

const STATUS = {
  pending:  'pending',
  starting: 'starting',
  ready:    'ready',
  stopped:  'stopped',
  error:    'error',
};

const statusIcon = {
  [STATUS.pending]:  `${c.gray}○${c.reset}`,
  [STATUS.starting]: `${c.yellow}◌${c.reset}`,
  [STATUS.ready]:    `${c.green}●${c.reset}`,
  [STATUS.stopped]:  `${c.gray}◌${c.reset}`,
  [STATUS.error]:    `${c.red}✖${c.reset}`,
};

const statusLabel = {
  [STATUS.pending]:  `${c.gray}pending${c.reset}`,
  [STATUS.starting]: `${c.yellow}starting${c.reset}`,
  [STATUS.ready]:    `${c.green}ready${c.reset}`,
  [STATUS.stopped]:  `${c.gray}stopped${c.reset}`,
  [STATUS.error]:    `${c.red}error${c.reset}`,
};

const serviceStatus = {};

function renderDashboard(servicesToShow) {
  const entries = servicesToShow.map((key) => {
    const svc = SERVICES[key];
    const st = serviceStatus[key] || STATUS.pending;
    return { key, ...svc, status: st };
  });

  const nameWidth = Math.max(...entries.map((s) => s.name.length));
  const boxWidth = nameWidth + 42;

  console.log('');
  console.log(`  ${c.gray}${'─'.repeat(boxWidth)}${c.reset}`);
  console.log(`  ${c.white}${c.bold} Service${' '.repeat(nameWidth - 4)}Status     URL${c.reset}`);
  console.log(`  ${c.gray}${'─'.repeat(boxWidth)}${c.reset}`);

  for (const svc of entries) {
    const icon = statusIcon[svc.status];
    const label = statusLabel[svc.status].padEnd(22);
    const pad = ' '.repeat(nameWidth - svc.name.length);
    const url = svc.status === STATUS.ready
      ? `${c.dim}http://localhost:${svc.port}${c.reset}`
      : '';
    const svcColor = colorFn[svc.color] || ((s) => s);
    console.log(`  ${icon} ${svcColor(svc.name)}${pad}  ${label} ${url}`);
  }

  console.log(`  ${c.gray}${'─'.repeat(boxWidth)}${c.reset}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Process helpers
// ---------------------------------------------------------------------------

/** Kill whatever is listening on a given port. */
function killPort(port) {
  return new Promise((resolve) => {
    const proc = spawn(
      `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /f /pid %a`,
      { stdio: 'ignore', shell: true },
    );
    proc.on('close', () => resolve());
  });
}

/** Open a pnpm command in a new Windows Terminal tab. */
function openInTab(args, { title = '', tabColor = '' } = {}) {
  const pnpmCmd = `pnpm ${args.join(' ')}`;
  const colorFlag = tabColor ? ` --tabColor "${tabColor}"` : '';
  const wtCmd = `wt -w 0 nt --title "${title}" --suppressApplicationTitle${colorFlag} -d "${ROOT}" cmd /k "${pnpmCmd}"`;
  const proc = spawn(wtCmd, {
    stdio: 'ignore',
    shell: true,
    detached: true,
  });
  proc.unref();
  return proc;
}

/** Poll a localhost port until it responds (or timeout). */
function waitForPort(port, { timeout = 90_000, interval = 1_500 } = {}) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, interval);
        }
      });
      req.end();
    };
    check();
  });
}

/** Cleanup: kill all service ports. */
async function cleanup(servicesToKill) {
  process.stdout.write(c.show);
  const spinner = new Spinner('Stopping all services...').start();
  await Promise.all(servicesToKill.map((key) => killPort(SERVICES[key].port)));
  spinner.succeed('All services stopped');
}

// ---------------------------------------------------------------------------
// Service launcher
// ---------------------------------------------------------------------------

async function startService(key) {
  const svc = SERVICES[key];
  serviceStatus[key] = STATUS.starting;

  // Kill anything already on this port
  await killPort(svc.port);

  const spinner = new Spinner(
    `Starting ${c.bold}${svc.name}${c.reset} on port ${c.cyan}${svc.port}${c.reset}...`
  ).start();

  // Open in new Windows Terminal tab
  openInTab(['--filter', svc.pkg, svc.cmd], {
    title: `TV: ${svc.name}`,
    tabColor: svc.tabColor,
  });

  try {
    await waitForPort(svc.port);
    serviceStatus[key] = STATUS.ready;
    spinner.succeed(
      `${c.bold}${svc.name}${c.reset} ready on ${c.cyan}http://localhost:${svc.port}${c.reset}`
    );
  } catch {
    serviceStatus[key] = STATUS.error;
    spinner.fail(`${c.bold}${svc.name}${c.reset} failed to start on port ${svc.port}`);
  }
}

async function restartService(key, servicesToShow) {
  const svc = SERVICES[key];
  console.log(`\n  ${c.yellow}Restarting ${svc.name}...${c.reset}`);
  await killPort(svc.port);
  serviceStatus[key] = STATUS.stopped;
  await startService(key);
  renderDashboard(servicesToShow);
}

// ---------------------------------------------------------------------------
// Interactive command loop
// ---------------------------------------------------------------------------

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function commandLoop(servicesToShow) {
  while (true) {
    const input = await prompt(`  ${c.cyan}tv >${c.reset} `);
    const [cmd, ...args] = input.toLowerCase().split(/\s+/);

    switch (cmd) {
      case 'd':
      case 'dash':
      case 'dashboard':
        renderDashboard(servicesToShow);
        break;

      case 'r':
      case 'restart': {
        const target = args[0];
        if (target && SERVICES[target] && servicesToShow.includes(target)) {
          await restartService(target, servicesToShow);
        } else {
          console.log(`  ${c.dim}Usage: restart <${servicesToShow.join('|')}>${c.reset}`);
        }
        break;
      }

      case 'q':
      case 'quit':
      case 'exit':
        console.log('');
        await cleanup(servicesToShow);
        process.exit(0);
        break;

      case 'h':
      case 'help':
      case '?':
        console.log('');
        console.log(`  ${c.white}${c.bold}Commands:${c.reset}`);
        console.log(`  ${c.cyan}d${c.reset}, ${c.cyan}dashboard${c.reset}         Show service status`);
        console.log(`  ${c.cyan}r${c.reset}, ${c.cyan}restart${c.reset} <service>  Restart a service (${servicesToShow.join(', ')})`);
        console.log(`  ${c.cyan}q${c.reset}, ${c.cyan}quit${c.reset}              Stop all services and exit`);
        console.log(`  ${c.cyan}h${c.reset}, ${c.cyan}help${c.reset}              Show this help`);
        console.log('');
        break;

      default:
        if (cmd) {
          console.log(`  ${c.dim}Unknown command. Type ${c.white}h${c.dim} for help.${c.reset}`);
        }
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function showBanner() {
  console.log('');
  console.log(`  ${c.cyan}${c.bold}┌─────────────────────────────────┐${c.reset}`);
  console.log(`  ${c.cyan}${c.bold}│     TrustVault Dev CLI          │${c.reset}`);
  console.log(`  ${c.cyan}${c.bold}│     ${c.reset}${c.dim}verifiable credentials${c.reset}${c.cyan}${c.bold}       │${c.reset}`);
  console.log(`  ${c.cyan}${c.bold}└─────────────────────────────────┘${c.reset}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  // Determine which services to start
  let servicesToStart = ['api', 'web', 'mobile'];

  if (args.includes('--api'))    servicesToStart = ['api'];
  if (args.includes('--web'))    servicesToStart = ['web'];
  if (args.includes('--mobile')) servicesToStart = ['mobile'];

  // Allow combining: --api --web
  if (args.filter((a) => a.startsWith('--')).length > 1) {
    servicesToStart = [];
    if (args.includes('--api'))    servicesToStart.push('api');
    if (args.includes('--web'))    servicesToStart.push('web');
    if (args.includes('--mobile')) servicesToStart.push('mobile');
  }

  showBanner();

  console.log(`  ${c.magenta}${c.bold}MODE${c.reset} ${c.dim}Split terminals — each service in its own tab${c.reset}`);
  console.log(`  ${c.magenta}${c.bold}SERVICES${c.reset} ${c.dim}${servicesToStart.map((k) => SERVICES[k].name).join(', ')}${c.reset}`);
  console.log('');

  // Handle exit
  process.on('SIGINT', async () => {
    await cleanup(servicesToStart);
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await cleanup(servicesToStart);
    process.exit(0);
  });

  // Start all services in parallel tabs
  await Promise.all(servicesToStart.map((key) => startService(key)));

  // Show dashboard
  renderDashboard(servicesToStart);

  const allReady = servicesToStart.every((k) => serviceStatus[k] === STATUS.ready);
  if (allReady) {
    console.log(`  ${c.green}${c.bold}All services running.${c.reset} ${c.dim}Each has its own terminal tab.${c.reset}`);
  } else {
    console.log(`  ${c.yellow}${c.bold}Some services failed to start.${c.reset} ${c.dim}Check the individual tabs for errors.${c.reset}`);
  }
  console.log('');
  console.log(`  ${c.dim}Commands:  ${c.white}d${c.dim}ashboard  ${c.white}r${c.dim}estart <svc>  ${c.white}q${c.dim}uit  ${c.white}h${c.dim}elp${c.reset}`);
  console.log('');

  // Enter interactive loop
  await commandLoop(servicesToStart);
}

main();
