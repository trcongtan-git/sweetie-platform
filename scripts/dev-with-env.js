#!/usr/bin/env node

/**
 * Development script that reads PORT from .env
 * Usage: node scripts/dev-with-env.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env if exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    }
  });
}

// Get PORT from env or default to 3000
const port = process.env.PORT || '3000';

console.log(`Starting Next.js dev server on port ${port}...`);

// Spawn Next.js dev server
const nextDev = spawn('next', ['dev', '--turbopack', '-p', port], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
});

nextDev.on('error', (error) => {
  console.error('Failed to start Next.js dev server:', error);
  process.exit(1);
});

nextDev.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle SIGINT and SIGTERM
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
});

