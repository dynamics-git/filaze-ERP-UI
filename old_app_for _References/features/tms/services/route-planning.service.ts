import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { RestService } from '../../../core/services/rest.service';
import {
  Hub,
  HubSummary,
  KpiSummary,
  LoadType,
  LocationDto,
  PodEntryDto,
  RouteOrder,
  RoutePlanningActionResult,
  RouteOrderCandidateDto,
  RouteTrip,
  RouteTripHeaderDto,
  RouteTripLineDto,
  Transporter,
  TransporterDto,
  TripStatus,
  Truck,
  TruckDto,
  WeighbridgeEntryDto,
  WeighbridgeRecord,
  mapHubFromApi,
  mapRouteOrderFromApi,
  mapRouteOrderFromTripLine,
  mapRouteTripHeaderFromApi,
  mapTransporterFromApi,
  mapTruckFromApi,
  mapWeighbridgeFromApi,
  mergeTripWithLines,
} from '../models/tms.models';

@Injectable({ providedIn: 'root' })
export class RoutePlanningService {
  constructor(private restService: RestService) {}

  private readonly genericActionError = 'The action could not be completed. Please try again.';
  private readonly routeCandidateEndpoint = '/routeordercandidates';

  private toRouteTripLineSourceDocumentType(): string {
    return 'Order';
  }

  private unwrapCollection<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (Array.isArray(response?.value)) {
      return response.value as T[];
    }

    return [];
  }

  private tripNoFromHeader(header: RouteTripHeaderDto): string {
    return String(header.No ?? header.no ?? header.id ?? '');
  }

  private tripHeaderApiId(header: RouteTripHeaderDto): string {
    return String(header.systemId ?? header.id ?? '');
  }

  private tripNoFromLine(line: RouteTripLineDto): string {
    return String(line.TripNo ?? line.tripNo ?? '');
  }

  private tripNoFromWeighbridge(entry: WeighbridgeEntryDto): string {
    return String(entry.TripNo ?? entry.tripNo ?? '');
  }

  private tripNoFromPod(entry: PodEntryDto): string {
    return String(entry.TripNo ?? entry.tripNo ?? '');
  }

  private sourceDocNo(line: RouteTripLineDto): string {
    return String(line.SourceDocumentNo ?? line.sourceDocumentNo ?? line.SourceDocNo ?? line.sourceDocNo ?? '');
  }

  private sourceLineNo(line: RouteTripLineDto): number {
    return Number(line.SourceLineNo ?? line.sourceLineNo ?? 0);
  }

  private orderSourceDocNo(order: Pick<RouteOrder, 'sourceDocumentNo' | 'id'>): string {
    return String(order.sourceDocumentNo ?? order.id.split('-')[0] ?? '');
  }

  private orderSourceLineNo(order: Pick<RouteOrder, 'sourceLineNo' | 'id'>): number {
    const [, lineNo] = order.id.split('-');
    return Number(order.sourceLineNo ?? lineNo ?? 0);
  }

  private odataString(value: string): string {
    return String(value || '').replace(/'/g, "''");
  }

  private entityPath(collection: string, key: string): string {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
      return `${collection}(${key})`;
    }

    return `${collection}('${key.replace(/'/g, "''")}')`;
  }

  private actionResult(ok: boolean, message: string): RoutePlanningActionResult {
    return { ok, message };
  }

  private extractErrorMessage(error: any, fallback: string): string {
    const raw =
      error?.error?.message ??
      error?.message ??
      error?.error?.error?.message ??
      error?.error ??
      fallback;

    const message = typeof raw === 'string' ? raw : fallback;
    return message.split('CorrelationId')[0].trim() || fallback;
  }

  private buildTripLinePayload(order: RouteOrder, tripId: string): RouteTripLineDto {
    return {
      tripNo: tripId,
      sourceDocumentType: this.toRouteTripLineSourceDocumentType(),
      sourceDocumentNo: this.orderSourceDocNo(order),
      sourceLineNo: this.orderSourceLineNo(order),
    };
  }

  private buildRouteOrderFromLine(
    line: RouteTripLineDto,
    tripId: string,
    candidateMap: Map<string, RouteOrder>
  ): RouteOrder {
    const orderId = `${this.sourceDocNo(line)}-${this.sourceLineNo(line)}`;
    const candidate = candidateMap.get(orderId);

    return mapRouteOrderFromTripLine(line, tripId, candidate || {});
  }

  private getTripLineByOrder(order: Pick<RouteOrder, 'id' | 'sourceDocumentNo' | 'sourceLineNo'>, tripId: string): Observable<RouteTripLineDto | null> {
    const sourceDocNo = this.orderSourceDocNo(order);
    const sourceLineNo = this.orderSourceLineNo(order);

    if (!sourceDocNo) {
      return of(null);
    }

    return this.restService
      .get(
        `/routetriplines?$filter=tripNo eq '${this.odataString(tripId)}' and sourceDocumentNo eq '${this.odataString(sourceDocNo)}' and sourceLineNo eq ${sourceLineNo}`
      )
      .pipe(
        map((response: any) => this.unwrapCollection<RouteTripLineDto>(response)[0] || null)
      );
  }

  private tripLineApiId(order: Pick<RouteOrder, 'tripLineSystemId'>, line?: RouteTripLineDto | null): string {
    return String(order.tripLineSystemId ?? line?.systemId ?? line?.id ?? '');
  }

  private resolveTripHeaderApiId(tripId: string): Observable<string | null> {
    return this.restService.get('/routetripheaders').pipe(
      map((response: any) => {
        const headers = this.unwrapCollection<RouteTripHeaderDto>(response);
        const header = headers.find((item) => {
          const tripNo = this.tripNoFromHeader(item);
          const apiId = this.tripHeaderApiId(item);
          return tripNo === tripId || apiId === tripId;
        });

        return header ? this.tripHeaderApiId(header) : null;
      }),
      catchError((err) => {
        console.error('Error resolving trip header key:', err);
        return of(null);
      })
    );
  }

  getHubs(): Observable<Hub[]> {
    return this.restService.get('/locations').pipe(
      map((response: any) => this.unwrapCollection<LocationDto>(response).map(mapHubFromApi)),
      catchError((err) => {
        console.error('Error fetching hubs:', err);
        return of([]);
      })
    );
  }

  getTransporters(): Observable<Transporter[]> {
    return this.restService.get('/transporters').pipe(
      map((response: any) => this.unwrapCollection<TransporterDto>(response).map(mapTransporterFromApi)),
      catchError((err) => {
        console.error('Error fetching transporters:', err);
        return of([]);
      })
    );
  }

  getTrucks(): Observable<Truck[]> {
    return this.restService.get('/trucks').pipe(
      map((response: any) => this.unwrapCollection<TruckDto>(response).map(mapTruckFromApi)),
      catchError((err) => {
        console.error('Error fetching trucks:', err);
        return of([]);
      })
    );
  }

  getRouteOrderCandidates(): Observable<RouteOrder[]> {
    return this.restService.get(this.routeCandidateEndpoint).pipe(
      map((response: any) => this.unwrapCollection<RouteOrderCandidateDto>(response).map(mapRouteOrderFromApi)),
      catchError((err) => {
        console.error('Error fetching route order candidates:', err);
        return of([]);
      })
    );
  }

  getUnassignedOrders(): Observable<RouteOrder[]> {
    return this.getRouteOrderCandidates().pipe(
      catchError((err) => {
        console.error('Error fetching unassigned orders:', err);
        return of([]);
      })
    );
  }

  getTrips(): Observable<RouteTrip[]> {
    return forkJoin({
      headers: this.restService.get('/routetripheaders'),
      lines: this.restService.get('/routetriplines'),
      trucks: this.getTrucks(),
      transporters: this.getTransporters(),
      hubs: this.getHubs(),
      weighbridges: this.restService.get('/weighbridgeentries').pipe(catchError(() => of([]))),
      pods: this.restService.get('/podentries').pipe(catchError(() => of([]))),
    }).pipe(
      map(({ headers, lines, trucks, transporters, hubs, weighbridges, pods }) => {
        const headerRows = this.unwrapCollection<RouteTripHeaderDto>(headers);
        const lineRows = this.unwrapCollection<RouteTripLineDto>(lines);
        const weighbridgeRows = this.unwrapCollection<WeighbridgeEntryDto>(weighbridges);
        const podRows = this.unwrapCollection<PodEntryDto>(pods);

        return headerRows.map((header) => {
          const tripNo = this.tripNoFromHeader(header);
          let trip = mapRouteTripHeaderFromApi(header, trucks, transporters, hubs);

          trip = mergeTripWithLines(
            trip,
            lineRows.filter((line) => this.tripNoFromLine(line) === tripNo),
            weighbridgeRows.find((entry) => this.tripNoFromWeighbridge(entry) === tripNo),
            podRows.find((entry) => this.tripNoFromPod(entry) === tripNo)
          );

          return trip;
        });
      }),
      catchError((err) => {
        console.error('Error fetching trips:', err);
        return of([]);
      })
    );
  }

  getTripById(tripId: string): Observable<RouteTrip | null> {
    return this.getTrips().pipe(map((trips) => trips.find((item) => item.id === tripId) || null));
  }

  getOrdersByTrip(tripId: string): Observable<RouteOrder[]> {
    return forkJoin({
      lines: this.restService.get(`/routetriplines?$filter=tripNo eq '${tripId.replace(/'/g, "''")}'`),
      candidates: this.getRouteOrderCandidates(),
    }).pipe(
      map(({ lines, candidates }) => {
        const lineRows = this.unwrapCollection<RouteTripLineDto>(lines);
        const candidateMap = new Map(candidates.map((item) => [item.id, item]));

        return lineRows.map((line) => this.buildRouteOrderFromLine(line, tripId, candidateMap));
      }),
      catchError((err) => {
        console.error('Error fetching orders by trip:', err);
        return of([]);
      })
    );
  }

  createTrip(
    hubId: string,
    transporterId: string,
    truckId: string,
    loadType: LoadType,
    plannedDate: string,
    notes: string
  ): Observable<RouteTrip | null> {
    const payload = {
      locationCode: hubId,
      transporterNo: transporterId,
      truckNo: truckId,
      loadType: loadType,
      plannedDate: plannedDate,
      notes: notes,
      status: 'Draft' as TripStatus,
    };

    return this.restService.post('/routetripheaders', payload).pipe(
      switchMap((response: any) => {
        const dto = response as RouteTripHeaderDto;

        return forkJoin({
          trucks: this.getTrucks(),
          transporters: this.getTransporters(),
          hubs: this.getHubs(),
        }).pipe(
          map(({ trucks, transporters, hubs }) =>
            mapRouteTripHeaderFromApi(dto, trucks, transporters, hubs)
          )
        );
      }),
      catchError((err) => {
        console.error('Error creating trip:', err);
        return of(null);
      })
    );
  }

  createTripDetailed(
    hubId: string,
    transporterId: string,
    truckId: string,
    loadType: LoadType,
    plannedDate: string,
    notes: string
  ): Observable<{ trip: RouteTrip | null; result: RoutePlanningActionResult }> {
    return this.createTrip(hubId, transporterId, truckId, loadType, plannedDate, notes).pipe(
      map((trip) => ({
        trip,
        result: trip
          ? this.actionResult(true, `Trip ${trip.tripNo || 'created'} successfully.`)
          : this.actionResult(false, 'Trip was not created.')
      })),
      catchError((err) =>
        of({
          trip: null,
          result: this.actionResult(false, this.extractErrorMessage(err, 'Failed to create trip.'))
        })
      )
    );
  }

  assignOrderToTrip(orderId: string, tripId: string): Observable<boolean> {
    return this.getRouteOrderCandidates().pipe(
      map((orders) => orders.find((item) => item.id === orderId) || null),
      switchMap((order) => {
        if (!order) {
          return of(false);
        }

        return this.assignOrderToTripDetailed(order, tripId).pipe(map((result) => result.ok));
      }),
      catchError((err) => {
        console.error('Error assigning order:', err);
        return of(false);
      })
    );
  }

  assignOrderToTripDetailed(order: RouteOrder, tripId: string): Observable<RoutePlanningActionResult> {
    return this.getTripLineByOrder(order, tripId).pipe(
      switchMap((existingLine) => {
        if (existingLine) {
          return of(this.actionResult(false, `Order ${order.orderNo} is already assigned to trip ${tripId}.`));
        }

        return this.restService.post('/routetriplines', this.buildTripLinePayload(order, tripId)).pipe(
          map(() => this.actionResult(true, `Order ${order.orderNo} assigned to trip ${tripId}.`)),
          catchError((err) => {
            console.error('Error assigning order:', err);
            return of(this.actionResult(false, this.extractErrorMessage(err, `Failed to assign order ${order.orderNo}.`)));
          })
        );
      }),
      catchError((err) => {
        console.error('Error assigning order:', err);
        return of(this.actionResult(false, this.extractErrorMessage(err, this.genericActionError)));
      })
    );
  }

  unassignOrderFromTrip(orderId: string, tripId: string): Observable<boolean> {
    const [sourceDocumentNo, sourceLineNo] = orderId.split('-');
    const order: RouteOrder = {
      id: orderId,
      orderNo: sourceDocumentNo,
      customerId: '',
      customerName: '',
      region: 'Central',
      hubId: '',
      loadType: 'Bulk',
      weightTonne: 0,
      bagCount: 0,
      deliveryDate: '',
      status: 'Assigned',
      tripId,
      notes: '',
      sourceDocumentNo,
      sourceLineNo: Number(sourceLineNo || 0),
      tripLineSystemId: '',
    };

    return this.unassignOrderFromTripDetailed(order, tripId).pipe(map((result) => result.ok));
  }

  unassignOrderFromTripDetailed(order: RouteOrder, tripId: string): Observable<RoutePlanningActionResult> {
    if (order.tripLineSystemId) {
      return this.restService.delete(this.entityPath('/routetriplines', order.tripLineSystemId)).pipe(
        map(() => this.actionResult(true, `Order ${order.orderNo} removed from trip ${tripId}.`)),
        catchError((err) => {
          console.error('Error unassigning order:', err);
          return of(this.actionResult(false, this.extractErrorMessage(err, `Failed to remove order ${order.orderNo}.`)));
        })
      );
    }

    return this.getTripLineByOrder(order, tripId).pipe(
      switchMap((line) => {
        if (!line) {
          return of(this.actionResult(false, `Order ${order.orderNo} was not found on trip ${tripId}.`));
        }

        const lineKey = this.tripLineApiId(order, line);
        if (!lineKey) {
          return of(this.actionResult(false, `Trip line for order ${order.orderNo} is missing its API key.`));
        }

        return this.restService.delete(this.entityPath('/routetriplines', lineKey)).pipe(
          map(() => this.actionResult(true, `Order ${order.orderNo} removed from trip ${tripId}.`)),
          catchError((err) => {
            console.error('Error unassigning order:', err);
            return of(this.actionResult(false, this.extractErrorMessage(err, `Failed to remove order ${order.orderNo}.`)));
          })
        );
      }),
      catchError((err) => {
        console.error('Error unassigning order:', err);
        return of(this.actionResult(false, this.extractErrorMessage(err, this.genericActionError)));
      })
    );
  }

  reassignOrderToTrip(order: RouteOrder, fromTripId: string, toTripId: string): Observable<RoutePlanningActionResult> {
    if (fromTripId === toTripId) {
      return of(this.actionResult(false, 'Choose a different destination trip.'));
    }

    return forkJoin({
      sourceLine: order.tripLineSystemId ? of(null) : this.getTripLineByOrder(order, fromTripId),
      targetLine: this.getTripLineByOrder(order, toTripId),
    }).pipe(
      switchMap(({ sourceLine, targetLine }) => {
        if (targetLine) {
          return of(this.actionResult(false, `Order ${order.orderNo} is already on trip ${toTripId}.`));
        }

        if (!order.tripLineSystemId && !sourceLine) {
          return of(this.actionResult(false, `Order ${order.orderNo} was not found on trip ${fromTripId}.`));
        }

        const lineKey = this.tripLineApiId(order, sourceLine);
        if (!lineKey) {
          return of(this.actionResult(false, `Trip line for order ${order.orderNo} is missing its API key.`));
        }

        return this.restService.delete(this.entityPath('/routetriplines', lineKey)).pipe(
          switchMap(() =>
            this.restService.post('/routetriplines', this.buildTripLinePayload({ ...order, tripId: toTripId }, toTripId)).pipe(
              map(() => this.actionResult(true, `Order ${order.orderNo} moved to trip ${toTripId}.`)),
              catchError((assignError) =>
                this.restService.post('/routetriplines', this.buildTripLinePayload({ ...order, tripId: fromTripId }, fromTripId)).pipe(
                  map(() =>
                    this.actionResult(
                      false,
                      `${this.extractErrorMessage(assignError, `Failed to move order ${order.orderNo}.`)} The original trip assignment was restored.`
                    )
                  ),
                  catchError(() =>
                    of(
                      this.actionResult(
                        false,
                        `${this.extractErrorMessage(assignError, `Failed to move order ${order.orderNo}.`)} The original assignment could not be restored automatically.`
                      )
                    )
                  )
                )
              )
            )
          ),
          catchError((err) => {
            console.error('Error reassigning order:', err);
            return of(this.actionResult(false, this.extractErrorMessage(err, `Failed to move order ${order.orderNo}.`)));
          })
        );
      }),
      catchError((err) => {
        console.error('Error reassigning order:', err);
        return of(this.actionResult(false, this.extractErrorMessage(err, this.genericActionError)));
      })
    );
  }

  updateTripStatus(tripId: string, status: TripStatus): Observable<boolean> {
    return this.resolveTripHeaderApiId(tripId).pipe(
      switchMap((apiId) => {
        if (!apiId) {
          return of(false);
        }

        return this.restService.patch(this.entityPath('/routetripheaders', apiId), { status }, '*').pipe(
          map(() => true)
        );
      }),
      catchError((err) => {
        console.error('Error updating trip status:', err);
        return of(false);
      })
    );
  }

  saveTrip(updatedTrip: RouteTrip): Observable<boolean> {
    return this.resolveTripHeaderApiId(updatedTrip.id).pipe(
      switchMap((apiId) => {
        if (!apiId) {
          return of(false);
        }

        return this.restService.patch(this.entityPath('/routetripheaders', apiId), { notes: updatedTrip.notes }, '*').pipe(
          map(() => true)
        );
      }),
      catchError((err) => {
        console.error('Error saving trip:', err);
        return of(false);
      })
    );
  }

  recordWeighbridge(
    tripId: string,
    tareWeight: number,
    grossWeight: number,
    recordedBy?: string
  ): Observable<WeighbridgeRecord | null> {
    const netWeight = grossWeight - tareWeight;
    const payload: WeighbridgeEntryDto = {
      tripNo: tripId,
      tareWeight: tareWeight,
      grossWeight: grossWeight,
      netWeight,
      overload: false,
      recordedBy: recordedBy || 'User',
      recordedAt: new Date().toISOString(),
    };

    return this.restService
      .get(`/weighbridgeentries?$filter=tripNo eq '${tripId.replace(/'/g, "''")}'`)
      .pipe(
      map((response: any) => this.unwrapCollection<WeighbridgeEntryDto>(response)[0] || null),
      switchMap((existingEntry) => {
        if (!existingEntry) {
          return this.restService.post('/weighbridgeentries', payload);
        }

        const entryKey = String(existingEntry.systemId ?? existingEntry.id ?? '');
        if (!entryKey) {
          return this.restService.post('/weighbridgeentries', payload);
        }

        return this.restService.patch(this.entityPath('/weighbridgeentries', entryKey), payload, '*');
      }),
      map((response: any) => mapWeighbridgeFromApi(response as WeighbridgeEntryDto)),
      catchError((err) => {
        console.error('Error recording weighbridge:', err);
        return of(null);
      })
    );
  }

  savePod(tripId: string, podDate: string): Observable<boolean> {
    const payload: PodEntryDto = {
      tripNo: tripId,
      podDate: podDate,
      receivedBy: 'User',
      remarks: '',
      receivedAt: new Date().toISOString(),
    };

    return this.restService.post('/podentries', payload).pipe(
      switchMap(() => this.getTripById(tripId)),
      switchMap((trip) => {
        if (trip?.status === 'POD Pending') {
          return this.updateTripStatus(tripId, 'Closed');
        }

        return of(true);
      }),
      catchError((err) => {
        console.error('Error saving POD:', err);
        return of(false);
      })
    );
  }

  getKpiSummary(): Observable<KpiSummary> {
    return forkJoin({
      orders: this.getUnassignedOrders(),
      trips: this.getTrips(),
    }).pipe(
      map(({ orders, trips }) => {
        const today = new Date().toISOString().split('T')[0];

        return {
          pendingOrders: orders.length,
          unassignedOrders: orders.filter((item) => !item.tripId).length,
          plannedTrips: trips.filter((item) => item.status === 'Planned').length,
          dispatchedTrips: trips.filter((item) => item.status === 'Dispatched').length,
          podPending: trips.filter((item) => item.status === 'POD Pending').length,
          delayedTrips: trips.filter((item) => ['Planned', 'Loaded'].includes(item.status) && item.plannedDate < today).length,
        };
      }),
      catchError((err) => {
        console.error('Error fetching KPI summary:', err);
        return of({
          pendingOrders: 0,
          unassignedOrders: 0,
          plannedTrips: 0,
          dispatchedTrips: 0,
          podPending: 0,
          delayedTrips: 0,
        });
      })
    );
  }

  getHubSummaries(): Observable<HubSummary[]> {
    return forkJoin({
      hubs: this.getHubs(),
      orders: this.getUnassignedOrders(),
      trips: this.getTrips(),
    }).pipe(
      map(({ hubs, orders, trips }) =>
        hubs.map((hub) => {
          const hubOrders = orders.filter((item) => item.hubId === hub.id);
          const hubTrips = trips.filter(
            (item) => item.hubId === hub.id && !['Delivered', 'Closed'].includes(item.status)
          );

          return {
            hub,
            pendingOrders: hubOrders.length,
            activeTrips: hubTrips.length,
            totalWeightTonne: hubTrips.reduce((sum, item) => sum + item.totalWeightTonne, 0),
          };
        })
      ),
      catchError((err) => {
        console.error('Error fetching hub summaries:', err);
        return of([]);
      })
    );
  }

  capacityPercent(trip: RouteTrip): number {
    if (!trip.truckCapacityTonne) {
      return 0;
    }

    return Math.min(100, Math.round((trip.totalWeightTonne / trip.truckCapacityTonne) * 100));
  }

  isOverloaded(trip: RouteTrip): boolean {
    return trip.totalWeightTonne > trip.truckCapacityTonne;
  }
}
