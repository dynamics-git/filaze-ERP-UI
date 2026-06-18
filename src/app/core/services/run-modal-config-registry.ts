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

function moduleDeclaresPageId(moduleRef: ConfigModuleBucket, normalizedPageId: string): boolean {
  if (!isRecord(moduleRef)) {
    return false;
  }

  for (const exportedValue of Object.values(moduleRef)) {
    if (!isRecord(exportedValue)) {
      continue;
    }

    const declaredPageId = toText(exportedValue['pageId']).trim().toLowerCase();
    if (declaredPageId === normalizedPageId) {
      return true;
    }
  }

  return false;
}

function findModuleByPath(pageId: string): ConfigModuleBucket | undefined {
  const normalizedPageId = pageId.trim().toLowerCase();
  if (!normalizedPageId.length) {
    return undefined;
  }

  const suffix = `/${normalizedPageId}/${normalizedPageId}.config.ts`;
  for (const [path, moduleRef] of Object.entries(discoveredConfigModules)) {
    if (normalizePath(path).endsWith(suffix) && moduleDeclaresPageId(moduleRef, normalizedPageId)) {
      return moduleRef;
    }
  }

  return undefined;
}

function findModuleByDeclaredPageId(pageId: string): ConfigModuleBucket | undefined {
  const normalizedPageId = pageId.trim().toLowerCase();
  if (!normalizedPageId.length) {
    return undefined;
  }

  for (const moduleRef of Object.values(discoveredConfigModules)) {
    if (moduleDeclaresPageId(moduleRef, normalizedPageId)) {
      return moduleRef;
    }
  }

  return undefined;
}

function resolveModule(pageId: string): ConfigModuleBucket | undefined {
  return findModuleByPath(pageId) ?? findModuleByDeclaredPageId(pageId);
}

function readPageTypeFromModule(moduleRef: ConfigModuleBucket, pageId: string): string | undefined {
  const normalizedPageId = pageId.trim().toLowerCase();
  if (!normalizedPageId.length) {
    return undefined;
  }

  for (const exportedValue of Object.values(moduleRef)) {
    if (!isRecord(exportedValue)) {
      continue;
    }

    const declaredPageId = toText(exportedValue['pageId']).trim().toLowerCase();
    if (declaredPageId !== normalizedPageId) {
      continue;
    }

    const pageType = toText(exportedValue['pageType']).trim().toLowerCase();
    if (pageType.length) {
      return pageType;
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

  const pageType = readPageTypeFromModule(moduleRef, pageId);
  if (pageType === 'worksheet' || pageType === 'setup') {
    return 'entry';
  }

  if (pageType === 'list' || pageType === 'card' || pageType === 'document') {
    return 'list';
  }

  return 'list';
}
