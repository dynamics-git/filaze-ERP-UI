import { Provider } from '@angular/core';
import {
  POPUP_STACK_POLICY,
  RUN_MODAL_CONFIG_RESOLVER,
  RunModalConfigModule,
  RunModalConfigResolver
} from '../../shared/erp-core/public-api';

const runModalConfigLoaders: Record<string, () => Promise<unknown>> = {
  prepayment: () => import('../../pages/prepayment/prepayment.config'),
  'purchase-order': () => import('../../pages/purchase-order/purchase-order.config'),
  'purchase-invoice': () => import('../../pages/purchase-invoice/purchase-invoice.config')
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
