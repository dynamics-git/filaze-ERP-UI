import { RunModalConfigModule } from '../../shared/erp-core/public-api';

type ConfigModuleBucket = Record<string, unknown>;
type PageOpenTarget = 'list' | 'entry';

const discoveredConfigModules = import.meta.glob('../../pages/**/*.config.ts', {
  eager: true,
}) as Record<string, ConfigModuleBucket>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase();
}

function findModuleByPath(pageId: string): ConfigModuleBucket | undefined {
  const normalizedPageId = pageId.trim().toLowerCase();
  if (!normalizedPageId.length) {
    return undefined;
  }

  const suffix = `/${normalizedPageId}/${normalizedPageId}.config.ts`;
  for (const [path, moduleRef] of Object.entries(discoveredConfigModules)) {
    if (normalizePath(path).endsWith(suffix)) {
      return moduleRef;
    }
  }

  return undefined;
}

function findModuleByDeclaredId(pageId: string): ConfigModuleBucket | undefined {
  const normalizedPageId = pageId.trim().toLowerCase();
  if (!normalizedPageId.length) {
    return undefined;
  }

  for (const moduleRef of Object.values(discoveredConfigModules)) {
    if (!isRecord(moduleRef)) {
      continue;
    }

    for (const exportedValue of Object.values(moduleRef)) {
      if (!isRecord(exportedValue)) {
        continue;
      }

      const declaredPageId = toText(exportedValue['pageId']).trim().toLowerCase();
      if (declaredPageId === normalizedPageId) {
        return moduleRef;
      }
    }
  }

  return undefined;
}

function resolveModule(pageId: string): ConfigModuleBucket | undefined {
  return findModuleByPath(pageId) ?? findModuleByDeclaredId(pageId);
}

function readOpenTargetFromModule(moduleRef: ConfigModuleBucket): PageOpenTarget | undefined {
  for (const exportedValue of Object.values(moduleRef)) {
    if (!isRecord(exportedValue)) {
      continue;
    }

    const defaultOpenTarget = toText(exportedValue['defaultOpenTarget']).trim().toLowerCase();
    if (defaultOpenTarget === 'list' || defaultOpenTarget === 'entry') {
      return defaultOpenTarget;
    }

    const pageType = toText(exportedValue['pageType']).trim().toLowerCase();
    if (pageType === 'worksheet' || pageType === 'setup') {
      return 'entry';
    }

    if (pageType === 'list' || pageType === 'card' || pageType === 'document') {
      return 'list';
    }
  }

  for (const [name, exportedValue] of Object.entries(moduleRef)) {
    if (!isRecord(exportedValue)) {
      continue;
    }

    const loweredName = name.toLowerCase();
    if (loweredName.includes('listconfig')) {
      return 'list';
    }

    if (loweredName.includes('headerconfig') || loweredName.includes('lineconfig')) {
      return 'entry';
    }
  }

  return undefined;
}

export function resolveRunModalConfigModule(pageId: string): RunModalConfigModule | undefined {
  const moduleRef = resolveModule(pageId);
  return moduleRef as RunModalConfigModule | undefined;
}

export function resolveRunModalOpenTarget(pageId: string): PageOpenTarget {
  const moduleRef = resolveModule(pageId);
  if (!moduleRef) {
    return 'list';
  }

  return readOpenTargetFromModule(moduleRef) ?? 'list';
}
