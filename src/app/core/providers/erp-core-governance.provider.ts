import { Provider } from '@angular/core';
import {
  POPUP_STACK_POLICY,
  RUN_MODAL_CONFIG_RESOLVER,
  RunModalConfigResolver
} from '../../shared/erp-core/public-api';
import { resolveRunModalConfigModule } from '../services/run-modal-config-registry';

const runModalConfigResolver: RunModalConfigResolver = async (pageId: string) => {
  return resolveRunModalConfigModule(pageId);
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
        onOverflow: 'replace-top'
      }
    }
  ];
}
