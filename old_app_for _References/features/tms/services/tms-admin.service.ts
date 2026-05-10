import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { RestService } from '../../../core/services/rest.service';
import {
  FreightChargeDto,
  FreightChargeSetup,
  Hub,
  ODataListResponse,
  TransporterDto,
  TransporterSetup,
  TruckDto,
  TruckSetup,
  buildFreightChargePayload,
  buildTransporterPayload,
  buildTruckPayload,
  isGuidLike,
  mapFreightChargeSetupFromApi,
  mapHubFromApi,
  mapTransporterSetupFromApi,
  mapTruckSetupFromApi,
  LocationDto,
} from '../models/tms.models';

@Injectable({
  providedIn: 'root',
})
export class TmsAdminService {
  private readonly freightChargeEndpoint = '/freightChargeSetups';

  constructor(private restService: RestService) {}

  getHubs(): Observable<Hub[]> {
    return this.restService.get('/locations').pipe(
      map((response: ODataListResponse<LocationDto> | LocationDto[]) =>
        this.unwrapCollection(response).map(mapHubFromApi)
      ),
      catchError((error) => {
        console.error('Failed to load hubs.', error);
        return of([]);
      })
    );
  }

  getTransporters(): Observable<TransporterSetup[]> {
    return this.restService.get('/transporters').pipe(
      map((response: ODataListResponse<TransporterDto> | TransporterDto[]) =>
        this.unwrapCollection(response).map(mapTransporterSetupFromApi)
      ),
      catchError((error) => {
        console.error('Failed to load transporters.', error);
        return of([]);
      })
    );
  }

  createTransporter(item: TransporterSetup): Observable<TransporterSetup | null> {
    return this.restService.post('/transporters', buildTransporterPayload(item)).pipe(
      map((response: any) => mapTransporterSetupFromApi(response as TransporterDto)),
      catchError((error) => {
        console.error('Failed to create transporter.', error);
        return of(null);
      })
    );
  }

  updateTransporter(item: TransporterSetup): Observable<TransporterSetup | null> {
    return this.restService
      .patch(this.entityEndpoint('/transporters', item.apiId), buildTransporterPayload(item), item.etag || '*')
      .pipe(
        map((response: any) => mapTransporterSetupFromApi(response as TransporterDto)),
        catchError((error) => {
          console.error('Failed to update transporter.', error);
          return of(null);
        })
      );
  }

  deleteTransporter(item: TransporterSetup): Observable<boolean> {
    return this.restService.delete(this.entityEndpoint('/transporters', item.apiId)).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Failed to delete transporter.', error);
        return of(false);
      })
    );
  }

  setTransporterActive(item: TransporterSetup, active: boolean): Observable<TransporterSetup | null> {
    return this.restService
      .patch(this.entityEndpoint('/transporters', item.apiId), { Active: active }, item.etag || '*')
      .pipe(
        map((response: any) => mapTransporterSetupFromApi(response as TransporterDto)),
        catchError((error) => {
          console.error('Failed to update transporter status.', error);
          return of(null);
        })
      );
  }

  getTrucks(): Observable<TruckSetup[]> {
    return this.restService.get('/trucks').pipe(
      map((response: ODataListResponse<TruckDto> | TruckDto[]) =>
        this.unwrapCollection(response).map(mapTruckSetupFromApi)
      ),
      catchError((error) => {
        console.error('Failed to load trucks.', error);
        return of([]);
      })
    );
  }

  createTruck(item: TruckSetup): Observable<TruckSetup | null> {
    return this.restService.post('/trucks', buildTruckPayload(item)).pipe(
      map((response: any) => mapTruckSetupFromApi(response as TruckDto)),
      catchError((error) => {
        console.error('Failed to create truck.', error);
        return of(null);
      })
    );
  }

  updateTruck(item: TruckSetup): Observable<TruckSetup | null> {
    return this.restService
      .patch(this.entityEndpoint('/trucks', item.apiId), buildTruckPayload(item), item.etag || '*')
      .pipe(
        map((response: any) => mapTruckSetupFromApi(response as TruckDto)),
        catchError((error) => {
          console.error('Failed to update truck.', error);
          return of(null);
        })
      );
  }

  deleteTruck(item: TruckSetup): Observable<boolean> {
    return this.restService.delete(this.entityEndpoint('/trucks', item.apiId)).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Failed to delete truck.', error);
        return of(false);
      })
    );
  }

  setTruckActive(item: TruckSetup, active: boolean): Observable<TruckSetup | null> {
    return this.restService
      .patch(this.entityEndpoint('/trucks', item.apiId), { Active: active }, item.etag || '*')
      .pipe(
        map((response: any) => mapTruckSetupFromApi(response as TruckDto)),
        catchError((error) => {
          console.error('Failed to update truck status.', error);
          return of(null);
        })
      );
  }

  getFreightCharges(): Observable<FreightChargeSetup[]> {
    return this.restService.get(this.freightChargeEndpoint).pipe(
      map((response: ODataListResponse<FreightChargeDto> | FreightChargeDto[]) =>
        this.unwrapCollection(response).map(mapFreightChargeSetupFromApi)
      ),
      catchError((error) => {
        console.error('Failed to load freight charges.', error);
        return of([]);
      })
    );
  }

  createFreightCharge(item: FreightChargeSetup): Observable<FreightChargeSetup | null> {
    return this.restService.post(this.freightChargeEndpoint, buildFreightChargePayload(item)).pipe(
      map((response: any) => mapFreightChargeSetupFromApi(response as FreightChargeDto)),
      catchError((error) => {
        console.error('Failed to create freight charge.', error);
        return of(null);
      })
    );
  }

  updateFreightCharge(item: FreightChargeSetup): Observable<FreightChargeSetup | null> {
    return this.restService
      .patch(this.entityEndpoint(this.freightChargeEndpoint, item.apiId), buildFreightChargePayload(item), item.etag || '*')
      .pipe(
        map((response: any) => mapFreightChargeSetupFromApi(response as FreightChargeDto)),
        catchError((error) => {
          console.error('Failed to update freight charge.', error);
          return of(null);
        })
      );
  }

  deleteFreightCharge(item: FreightChargeSetup): Observable<boolean> {
    return this.restService.delete(this.entityEndpoint(this.freightChargeEndpoint, item.apiId)).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Failed to delete freight charge.', error);
        return of(false);
      })
    );
  }

  setFreightChargeActive(item: FreightChargeSetup, active: boolean): Observable<FreightChargeSetup | null> {
    return this.restService
      .patch(this.entityEndpoint(this.freightChargeEndpoint, item.apiId), { Active: active }, item.etag || '*')
      .pipe(
        map((response: any) => mapFreightChargeSetupFromApi(response as FreightChargeDto)),
        catchError((error) => {
          console.error('Failed to update freight charge status.', error);
          return of(null);
        })
      );
  }

  private entityEndpoint(collection: string, apiId: string): string {
    const key = isGuidLike(apiId) ? apiId : `'${apiId.replace(/'/g, "''")}'`;
    return `${collection}(${key})`;
  }

  private unwrapCollection<T>(response: ODataListResponse<T> | T[] | null | undefined): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    return Array.isArray(response?.value) ? response.value : [];
  }
}
