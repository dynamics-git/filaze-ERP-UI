import { Provider } from '@angular/core';
import { DATA_REST_SERVICE, DataRestService } from '../../shared/erp-core/services/data-source.service';
import { RestService } from '../services/rest.service';

export const provideErpRest = (): Provider => ({
  provide: DATA_REST_SERVICE,
  deps: [RestService],
  useFactory: (restService: RestService): DataRestService => ({
    get: (endpoint: string, options?: { skipCompanyScope?: boolean }) => restService.get(endpoint, options),
    post: (endpoint: string, payload: unknown, options?: { skipCompanyScope?: boolean }) => restService.post(endpoint, payload, options),
    patch: (endpoint: string, payload: unknown, ifMatch?: string, options?: { skipCompanyScope?: boolean }) => restService.patch(endpoint, payload, ifMatch, options),
    delete: (endpoint: string, options?: { skipCompanyScope?: boolean }) => restService.delete(endpoint, options)
  })
});
