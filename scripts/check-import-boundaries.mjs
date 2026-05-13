import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = join(ROOT, 'src', 'app', 'pages');

const TARGET_EXTENSIONS = new Set(['.ts']);
const SKIP_SUFFIXES = ['.spec.ts'];

// Any page-level import that reaches into internal erp-core folders is forbidden.
const FORBIDDEN_PATTERNS = [
  /shared\/erp-core\/services\//,
  /shared\/erp-core\/models\//,
  /shared\/erp-core\/components\//,
  /shared\/erp-core\/constants\//
];

const ALLOWED_PUBLIC_PATHS = new Set([
  '../../shared/erp-core/public-api',
  '../../shared/erp-core/public-api.ts',
  '../shared/erp-core/public-api',
  '../shared/erp-core/public-api.ts'
]);

function walk(dirPath, collector) {
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, collector);
      continue;
    }

    if (!stats.isFile()) {
      continue;
    }

    if (!TARGET_EXTENSIONS.has(fullPath.slice(fullPath.lastIndexOf('.')))) {
      continue;
    }

    if (SKIP_SUFFIXES.some((suffix) => fullPath.endsWith(suffix))) {
      continue;
    }

    collector.push(fullPath);
  }
}

function findImportViolations(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.includes('from ')) {
      continue;
    }

    const match = line.match(/from\s+['\"]([^'\"]+)['\"]/);
    if (!match) {
      continue;
    }

    const importPath = match[1];
    if (ALLOWED_PUBLIC_PATHS.has(importPath)) {
      continue;
    }

    if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(importPath))) {
      violations.push({
        line: index + 1,
        importPath,
        source: line.trim()
      });
    }
  }

  return violations;
}

function main() {
  const pageFiles = [];
  walk(PAGES_DIR, pageFiles);

  const allViolations = [];

  for (const filePath of pageFiles) {
    const violations = findImportViolations(filePath);
    if (violations.length > 0) {
      allViolations.push({
        filePath,
        violations
      });
    }
  }

  if (!allViolations.length) {
    console.log('Import boundary check passed: no deep erp-core imports in src/app/pages.');
    process.exit(0);
  }

  console.error('Import boundary check failed. Use shared core only via src/app/shared/erp-core/public-api.ts');
  for (const fileEntry of allViolations) {
    const relativePath = relative(ROOT, fileEntry.filePath).replace(/\\/g, '/');
    console.error(`\n${relativePath}`);
    for (const violation of fileEntry.violations) {
      console.error(`  Line ${violation.line}: ${violation.importPath}`);
      console.error(`    ${violation.source}`);
    }
  }

  process.exit(1);
}

main();
