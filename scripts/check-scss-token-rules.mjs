import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');

const TARGET_EXTENSIONS = new Set(['.scss']);
const TOKEN_FILE_PATTERNS = [
  /\/assets\/styles\/_tokens\.scss$/,
  /\/assets\/styles\/tokens\//
];

const RULES = {
  noUiNamespace: /--ui-|var\(\s*--ui-/i,
  noVarFallback: /var\(\s*--[a-z0-9-]+\s*,/i,
  noRawColorHex: /#[0-9a-fA-F]{3,8}\b/,
  noRawColorFn: /\b(?:rgb|rgba|hsl|hsla)\s*\(/i
};

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

    const extension = fullPath.slice(fullPath.lastIndexOf('.')).toLowerCase();
    if (!TARGET_EXTENSIONS.has(extension)) {
      continue;
    }

    collector.push(fullPath);
  }
}

function isTokenFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return TOKEN_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function collectViolations(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];
  const tokenFile = isTokenFile(filePath);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNo = index + 1;

    if (RULES.noUiNamespace.test(line)) {
      violations.push({ line: lineNo, rule: 'no-ui-namespace', source: line.trim() });
    }

    if (RULES.noVarFallback.test(line)) {
      violations.push({ line: lineNo, rule: 'no-var-fallback', source: line.trim() });
    }

    if (!tokenFile) {
      if (RULES.noRawColorHex.test(line)) {
        violations.push({ line: lineNo, rule: 'no-raw-color-hex', source: line.trim() });
      }

      if (RULES.noRawColorFn.test(line)) {
        violations.push({ line: lineNo, rule: 'no-raw-color-function', source: line.trim() });
      }
    }
  }

  return violations;
}

function main() {
  const files = [];
  walk(SRC_DIR, files);

  const allViolations = [];
  for (const filePath of files) {
    const violations = collectViolations(filePath);
    if (violations.length > 0) {
      allViolations.push({ filePath, violations });
    }
  }

  if (!allViolations.length) {
    console.log('SCSS token governance check passed.');
    process.exit(0);
  }

  console.error('SCSS token governance check failed.');
  console.error('Rules: no --ui- namespace, no var() fallback, no raw colors outside token files.');

  for (const fileEntry of allViolations) {
    const rel = relative(ROOT, fileEntry.filePath).replace(/\\/g, '/');
    console.error(`\n${rel}`);
    for (const violation of fileEntry.violations) {
      console.error(`  Line ${violation.line} [${violation.rule}] ${violation.source}`);
    }
  }

  process.exit(1);
}

main();
