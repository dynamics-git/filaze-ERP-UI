import { Provider } from '@angular/core';
import {
  POPUP_STACK_POLICY,
  RUN_MODAL_CONFIG_RESOLVER,
  RunModalConfigModule,
  RunModalConfigResolver
} from '../../shared/erp-core/public-api';

const runModalConfigLoaders: Record<string, () => Promise<unknown>> = {
  'purchase-order': () => import('../../pages/purchase-order/purchase-order.config'),
  'customer-ledger-entry': () => import('../../pages/customer-ledger-entry/customer-ledger-entry.config')
};

const runModalConfigResolver: RunModalConfigResolver = async (pageId: string): Promise<RunModalConfigModule | undefined> => {
  const normalized = pageId.trim().toLowerCase();
  const loader = runModalConfigLoaders[normalized];
  if (!loader) {
    return undefined;
  }

  const moduleRef = await loader();
  return moduleRef as RunModalConfigModule;
};

export function provideErpCoreGovernance(): Provider[] {
  return [
    {
      provide: RUN_MODAL_CONFIG_RESOLVER,
      useValue: runModalConfigResolver
    },
    {
      provide: POPUP_STACK_POLICY,
      useValue: {
        maxDepth: 50,
        onOverflow: 'block'
      }
    }
  ];
}
