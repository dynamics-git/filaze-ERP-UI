#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

function readArg(name) {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) return '';
  return args[index + 1];
}

const repo = readArg('--repo');
const tag = readArg('--tag');
const packageName = readArg('--package') || '@filaze/erp-core';
const targetPathArg = readArg('--target') || 'src/app/shared/erp-core';

if (!repo || !tag) {
  console.error('Usage: npm run core:install -- --repo <CORE_REPO_URL> --tag <VERSION_TAG> [--package <PACKAGE_NAME>] [--target <TARGET_PATH>]');
  process.exit(1);
}

const spec = `${packageName}@${repo}#${tag}`;

const result = spawnSync('npm', ['install', spec], {
  stdio: 'inherit',
  shell: true,
});

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

const projectRoot = process.cwd();
const packageRoot = path.join(projectRoot, 'node_modules', ...packageName.split('/'));
const targetPath = path.join(projectRoot, ...targetPathArg.split('/'));

const sourceCandidates = [
  path.join(packageRoot, 'src', 'app', 'shared', 'erp-core'),
  path.join(packageRoot, 'erp-core'),
  packageRoot,
];

const sourcePath = sourceCandidates.find((candidate) => fs.existsSync(candidate));
if (!sourcePath) {
  console.error('Unable to find core source folder in installed package.');
  console.error(`Checked package root: ${packageRoot}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.rmSync(targetPath, { recursive: true, force: true });
fs.cpSync(sourcePath, targetPath, { recursive: true });

console.log(`Synced core from ${sourcePath} to ${targetPath}`);
process.exit(0);
