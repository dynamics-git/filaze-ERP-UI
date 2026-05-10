import { Provider } from '@angular/core';
import { ERP_REST_SERVICE, ErpRestService } from '../../shared/erp-core/services/data-source.service';
import { RestService } from '../services/rest.service';

export const provideErpRest = (): Provider => ({
  provide: ERP_REST_SERVICE,
  deps: [RestService],
  useFactory: (restService: RestService): ErpRestService => ({
    get: (endpoint: string) => restService.get(endpoint)
  })
});
