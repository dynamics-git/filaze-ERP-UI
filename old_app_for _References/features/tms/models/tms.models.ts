export type TripStatus =
  | 'Draft'
  | 'Planned'
  | 'Loaded'
  | 'Dispatched'
  | 'Delivered'
  | 'POD Pending'
  | 'Closed';

export type LoadType = 'Bulk' | 'Bag';

export type OrderStatus = 'Pending' | 'Assigned' | 'Dispatched' | 'Delivered';

export type Region = 'Northern' | 'Central' | 'East' | 'Southern';

export interface Hub {
  id: string;
  name: string;
  location: string;
  regions: Region[];
}

export interface Transporter {
  id: string;
  name: string;
  contactNo: string;
  email: string;
}

export interface Truck {
  id: string;
  plateNo: string;
  capacityTonne: number;
  loadType: LoadType;
  transporterId: string;
}

export interface Customer {
  id: string;
  name: string;
  region: Region;
  address: string;
}

export interface RouteOrder {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  region: Region;
  hubId: string;
  loadType: LoadType;
  weightTonne: number;
  bagCount: number;
  deliveryDate: string;
  status: OrderStatus;
  tripId: string;
  notes: string;
  sourceDocumentType?: string;
  sourceDocumentNo?: string;
  sourceLineNo?: number;
  shipToCode?: string;
  tripLineSystemId?: string;
}

export interface WeighbridgeRecord {
  id: string;
  apiId: string;
  entryNo: string;
  tripId: string;
  tareWeight: number;
  grossWeight: number;
  netWeight: number;
  overload: boolean;
  recordedAt: string;
  recordedBy: string;
}

export interface RouteTrip {
  id: string;
  tripNo: string;
  hubId: string;
  hubName: string;
  transporterId: string;
  transporterName: string;
  truckId: string;
  truckPlate: string;
  truckCapacityTonne: number;
  loadType: LoadType;
  orderIds: string[];
  totalWeightTonne: number;
  totalBags: number;
  status: TripStatus;
  plannedDate: string;
  weighbridge: WeighbridgeRecord | null;
  podReceived: boolean;
  podDate: string;
  notes: string;
  createdAt: string;
}

export interface KpiSummary {
  pendingOrders: number;
  unassignedOrders: number;
  plannedTrips: number;
  dispatchedTrips: number;
  podPending: number;
  delayedTrips: number;
}

export interface HubSummary {
  hub: Hub;
  pendingOrders: number;
  activeTrips: number;
  totalWeightTonne: number;
}

export interface NewTripForm {
  hubId: string;
  transporterId: string;
  truckId: string;
  loadType: LoadType;
  plannedDate: string;
  notes: string;
}

export interface RoutePlanningActionResult {
  ok: boolean;
  message: string;
}

export interface TmsEntityMeta {
  apiId: string;
  etag: string;
}

export interface TransporterSetup extends TmsEntityMeta {
  code: string;
  name: string;
  phoneNo: string;
  email: string;
  active: boolean;
  defaultFreightType: LoadType | '';
  remarks: string;
}

export interface TruckSetup extends TmsEntityMeta {
  truckNo: string;
  transporterId: string;
  transporterName: string;
  plateNo: string;
  loadType: LoadType;
  capacityTonne: number;
  gpsEnabled: boolean;
  active: boolean;
}

export interface FreightChargeSetup extends TmsEntityMeta {
  code: string;
  locationCode: string;
  region: string;
  loadType: LoadType;
  freightRate: number;
  handlingCharge: number;
  active: boolean;
  remarks: string;
}

export interface ODataListResponse<T> {
  value?: T[];
}

export interface ApiRecord {
  '@odata.etag'?: string;
  id?: string;
  systemId?: string;
  [key: string]: unknown;
}

export interface LocationDto extends ApiRecord {
  Code?: string;
  code?: string;
  Name?: string;
  name?: string;
  Address?: string;
  address?: string;
  Regions?: string[] | string;
  regions?: string[] | string;
}

export interface TransporterDto extends ApiRecord {
  No?: string;
  no?: string;
  Code?: string;
  code?: string;
  Name?: string;
  name?: string;
  Contact?: string;
  contact?: string;
  Phone?: string;
  phone?: string;
  PhoneNo?: string;
  phoneNo?: string;
  Email?: string;
  email?: string;
  Active?: boolean;
  active?: boolean;
  DefaultFreightType?: string;
  defaultFreightType?: string;
  Remarks?: string;
  remarks?: string;
}

export interface TruckDto extends ApiRecord {
  No?: string;
  no?: string;
  TruckNo?: string;
  truckNo?: string;
  PlateNo?: string;
  plateNo?: string;
  TransporterNo?: string;
  transporterNo?: string;
  TransporterCode?: string;
  transporterCode?: string;
  TransporterId?: string;
  transporterId?: string;
  TransporterName?: string;
  transporterName?: string;
  LoadType?: string;
  loadType?: string;
  CapacityTonne?: number;
  capacityTonne?: number;
  GPSEnabled?: boolean;
  gpsEnabled?: boolean;
  Active?: boolean;
  active?: boolean;
}

export interface FreightChargeDto extends ApiRecord {
  Code?: string;
  code?: string;
  LocationCode?: string;
  locationCode?: string;
  Region?: string;
  region?: string;
  LoadType?: string;
  loadType?: string;
  FreightRate?: number;
  freightRate?: number;
  HandlingCharge?: number;
  handlingCharge?: number;
  Active?: boolean;
  active?: boolean;
  Remarks?: string;
  remarks?: string;
}

export interface RouteOrderCandidateDto extends ApiRecord {
  SourceDocNo?: string;
  sourceDocNo?: string;
  SourceDocumentType?: string;
  sourceDocumentType?: string;
  SourceDocumentNo?: string;
  sourceDocumentNo?: string;
  SourceLineNo?: number;
  sourceLineNo?: number;
  CustomerNo?: string;
  customerNo?: string;
  CustomerName?: string;
  customerName?: string;
  ShipToCode?: string;
  shipToCode?: string;
  Region?: string;
  region?: string;
  LocationCode?: string;
  locationCode?: string;
  LoadType?: string;
  loadType?: string;
  WeightTonne?: number;
  weightTonne?: number;
  BagCount?: number;
  bagCount?: number;
  DeliveryDate?: string;
  deliveryDate?: string;
}

export interface RouteTripHeaderDto extends ApiRecord {
  No?: string;
  no?: string;
  LocationCode?: string;
  locationCode?: string;
  HubCode?: string;
  hubCode?: string;
  TransporterNo?: string;
  transporterNo?: string;
  TruckNo?: string;
  truckNo?: string;
  LoadType?: string;
  loadType?: string;
  PlannedDate?: string;
  plannedDate?: string;
  Status?: string;
  status?: string;
  Notes?: string;
  notes?: string;
  TotalWeightTonne?: number;
  totalWeightTonne?: number;
  TotalBags?: number;
  totalBags?: number;
  CreatedAt?: string;
  createdAt?: string;
}

export interface RouteTripLineDto extends ApiRecord {
  TripNo?: string;
  tripNo?: string;
  LineNo?: number;
  lineNo?: number;
  SourceDocNo?: string;
  sourceDocNo?: string;
  SourceDocumentType?: string;
  sourceDocumentType?: string;
  SourceDocumentNo?: string;
  sourceDocumentNo?: string;
  SourceLineNo?: number;
  sourceLineNo?: number;
  CustomerNo?: string;
  customerNo?: string;
  CustomerName?: string;
  customerName?: string;
  ShipToCode?: string;
  shipToCode?: string;
  Region?: string;
  region?: string;
  LocationCode?: string;
  locationCode?: string;
  LoadType?: string;
  loadType?: string;
  WeightTonne?: number;
  weightTonne?: number;
  BagCount?: number;
  bagCount?: number;
  SequenceNo?: number;
  sequenceNo?: number;
  LineStatus?: string;
  lineStatus?: string;
}

export interface WeighbridgeEntryDto extends ApiRecord {
  EntryNo?: string | number;
  entryNo?: string | number;
  TripNo?: string;
  tripNo?: string;
  TareWeight?: number;
  tareWeight?: number;
  GrossWeight?: number;
  grossWeight?: number;
  NetWeight?: number;
  netWeight?: number;
  RecordedBy?: string;
  recordedBy?: string;
  RecordedAt?: string;
  recordedAt?: string;
}

export interface PodEntryDto extends ApiRecord {
  EntryNo?: string | number;
  entryNo?: string | number;
  TripNo?: string;
  tripNo?: string;
  PodDate?: string;
  podDate?: string;
  ReceivedBy?: string;
  receivedBy?: string;
  PhotoPath?: string;
  photoPath?: string;
  Remarks?: string;
  remarks?: string;
  ReceivedAt?: string;
  receivedAt?: string;
}

const REGIONS: Region[] = ['Northern', 'Central', 'East', 'Southern'];

function firstDefined<T>(...values: Array<T | null | undefined>): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function stringValue(dto: ApiRecord | undefined, ...keys: string[]): string {
  if (!dto) {
    return '';
  }

  for (const key of keys) {
    const value = dto[key];
    if (value === undefined || value === null) {
      continue;
    }

    const text = String(value).trim();
    if (text) {
      return text;
    }
  }

  return '';
}

function numberValue(dto: ApiRecord | undefined, ...keys: string[]): number {
  if (!dto) {
    return 0;
  }

  for (const key of keys) {
    const value = dto[key];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function booleanValue(dto: ApiRecord | undefined, ...keys: string[]): boolean {
  if (!dto) {
    return false;
  }

  for (const key of keys) {
    const value = dto[key];
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', 'yes', '1', 'active'].includes(normalized)) {
        return true;
      }

      if (['false', 'no', '0', 'inactive'].includes(normalized)) {
        return false;
      }
    }

    if (typeof value === 'number') {
      return value !== 0;
    }
  }

  return false;
}

function normalizeLoadType(value: string): LoadType {
  return String(value).trim().toLowerCase() === 'bag' ? 'Bag' : 'Bulk';
}

function normalizeTripStatus(value: string): TripStatus {
  const normalized = String(value || '').trim();

  if (normalized === 'Planned' ||
      normalized === 'Loaded' ||
      normalized === 'Dispatched' ||
      normalized === 'Delivered' ||
      normalized === 'POD Pending' ||
      normalized === 'Closed') {
    return normalized;
  }

  return 'Draft';
}

function normalizeRegion(value: string): Region | null {
  const match = REGIONS.find((region) => region.toLowerCase() === value.trim().toLowerCase());
  return match || null;
}

export function parseRegions(value: unknown): Region[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeRegion(String(item)))
      .filter((item): item is Region => !!item);
  }

  if (typeof value === 'string') {
    return value
      .split(/[|,;/]/)
      .map((item) => normalizeRegion(item))
      .filter((item): item is Region => !!item);
  }

  return [];
}

export function extractApiId(dto: ApiRecord): string {
  return stringValue(dto, 'id', 'systemId', 'No', 'no', 'Code', 'code', 'TruckNo', 'truckNo');
}

export function mapHubFromApi(dto: LocationDto): Hub {
  return {
    id: stringValue(dto, 'Code', 'code', 'id'),
    name: stringValue(dto, 'Name', 'name', 'Code', 'code'),
    location: stringValue(dto, 'Address', 'address', 'Name', 'name', 'Code', 'code'),
    regions: parseRegions(firstDefined(dto.Regions, dto.regions)),
  };
}

export function mapTransporterFromApi(dto: TransporterDto): Transporter {
  return {
    id: stringValue(dto, 'No', 'no', 'Code', 'code', 'id'),
    name: stringValue(dto, 'Name', 'name', 'No', 'no', 'Code', 'code'),
    contactNo: stringValue(dto, 'PhoneNo', 'phoneNo', 'Phone', 'phone', 'Contact', 'contact'),
    email: stringValue(dto, 'Email', 'email'),
  };
}

export function mapTruckFromApi(dto: TruckDto): Truck {
  return {
    id: stringValue(dto, 'No', 'no', 'TruckNo', 'truckNo', 'id'),
    plateNo: stringValue(dto, 'PlateNo', 'plateNo'),
    capacityTonne: numberValue(dto, 'CapacityTonne', 'capacityTonne'),
    loadType: normalizeLoadType(stringValue(dto, 'LoadType', 'loadType')),
    transporterId: stringValue(dto, 'TransporterNo', 'transporterNo', 'TransporterCode', 'transporterCode', 'TransporterId', 'transporterId'),
  };
}

export function mapRouteOrderFromApi(dto: RouteOrderCandidateDto): RouteOrder {
  const sourceDocumentType = stringValue(dto, 'SourceDocumentType', 'sourceDocumentType');
  const sourceDocNo = stringValue(dto, 'SourceDocumentNo', 'sourceDocumentNo', 'SourceDocNo', 'sourceDocNo');
  const sourceLineNo = numberValue(dto, 'SourceLineNo', 'sourceLineNo');
  const region = normalizeRegion(stringValue(dto, 'Region', 'region')) || 'Central';

  return {
    id: `${sourceDocNo}-${sourceLineNo}`,
    orderNo: sourceDocNo,
    customerId: stringValue(dto, 'CustomerNo', 'customerNo'),
    customerName: stringValue(dto, 'CustomerName', 'customerName'),
    region,
    hubId: stringValue(dto, 'LocationCode', 'locationCode'),
    loadType: normalizeLoadType(stringValue(dto, 'LoadType', 'loadType')),
    weightTonne: numberValue(dto, 'WeightTonne', 'weightTonne'),
    bagCount: numberValue(dto, 'BagCount', 'bagCount'),
    deliveryDate: stringValue(dto, 'DeliveryDate', 'deliveryDate'),
    status: 'Pending',
    tripId: '',
    notes: '',
    sourceDocumentType,
    sourceDocumentNo: sourceDocNo,
    sourceLineNo,
    shipToCode: stringValue(dto, 'ShipToCode', 'shipToCode'),
    tripLineSystemId: '',
  };
}

export function mapRouteOrderFromTripLine(
  dto: RouteTripLineDto,
  tripId: string,
  fallback?: Partial<RouteOrder>
): RouteOrder {
  const sourceDocumentType =
    stringValue(dto, 'SourceDocumentType', 'sourceDocumentType') || fallback?.sourceDocumentType || '';
  const sourceDocNo =
    stringValue(dto, 'SourceDocumentNo', 'sourceDocumentNo', 'SourceDocNo', 'sourceDocNo') ||
    fallback?.sourceDocumentNo ||
    '';
  const sourceLineNo = numberValue(dto, 'SourceLineNo', 'sourceLineNo') || fallback?.sourceLineNo || 0;
  const region = normalizeRegion(stringValue(dto, 'Region', 'region') || fallback?.region || '') || 'Central';
  const hubId = stringValue(dto, 'LocationCode', 'locationCode') || fallback?.hubId || '';

  return {
    id: `${sourceDocNo}-${sourceLineNo}`,
    orderNo: sourceDocNo,
    customerId: stringValue(dto, 'CustomerNo', 'customerNo') || fallback?.customerId || '',
    customerName: stringValue(dto, 'CustomerName', 'customerName') || fallback?.customerName || '',
    region,
    hubId,
    loadType: normalizeLoadType(
      stringValue(dto, 'LoadType', 'loadType') || String(fallback?.loadType || 'Bulk')
    ),
    weightTonne: numberValue(dto, 'WeightTonne', 'weightTonne') || fallback?.weightTonne || 0,
    bagCount: numberValue(dto, 'BagCount', 'bagCount') || fallback?.bagCount || 0,
    deliveryDate: fallback?.deliveryDate || '',
    status: 'Assigned',
    tripId,
    notes: fallback?.notes || '',
    sourceDocumentType,
    sourceDocumentNo: sourceDocNo,
    sourceLineNo,
    shipToCode: stringValue(dto, 'ShipToCode', 'shipToCode') || fallback?.shipToCode || '',
    tripLineSystemId: stringValue(dto, 'systemId', 'id') || fallback?.tripLineSystemId || '',
  };
}

export function mapRouteTripHeaderFromApi(
  dto: RouteTripHeaderDto,
  trucks: Truck[],
  transporters: Transporter[],
  hubs: Hub[]
): RouteTrip {
  const tripNo = stringValue(dto, 'No', 'no', 'id');
  const hubCode = stringValue(dto, 'LocationCode', 'locationCode', 'HubCode', 'hubCode');
  const transporterNo = stringValue(dto, 'TransporterNo', 'transporterNo');
  const truckNo = stringValue(dto, 'TruckNo', 'truckNo');
  const truck = trucks.find((item) => item.id === truckNo);
  const transporter = transporters.find((item) => item.id === transporterNo);
  const hub = hubs.find((item) => item.id === hubCode);

  return {
    id: tripNo,
    tripNo,
    hubId: hubCode,
    hubName: hub?.name || hubCode,
    transporterId: transporterNo,
    transporterName: transporter?.name || transporterNo,
    truckId: truckNo,
    truckPlate: truck?.plateNo || truckNo,
    truckCapacityTonne: truck?.capacityTonne || 0,
    loadType: normalizeLoadType(stringValue(dto, 'LoadType', 'loadType')),
    orderIds: [],
    totalWeightTonne: numberValue(dto, 'TotalWeightTonne', 'totalWeightTonne'),
    totalBags: numberValue(dto, 'TotalBags', 'totalBags'),
    status: normalizeTripStatus(stringValue(dto, 'Status', 'status')),
    plannedDate: stringValue(dto, 'PlannedDate', 'plannedDate'),
    weighbridge: null,
    podReceived: false,
    podDate: '',
    notes: stringValue(dto, 'Notes', 'notes'),
    createdAt: stringValue(dto, 'CreatedAt', 'createdAt') || new Date().toISOString(),
  };
}

export function mergeTripWithLines(
  trip: RouteTrip,
  lines: RouteTripLineDto[],
  weighbridge?: WeighbridgeEntryDto,
  pod?: PodEntryDto
): RouteTrip {
  trip.orderIds = lines.map((line) => {
    const sourceDocNo = stringValue(line, 'SourceDocumentNo', 'sourceDocumentNo', 'SourceDocNo', 'sourceDocNo');
    const sourceLineNo = numberValue(line, 'SourceLineNo', 'sourceLineNo');
    return `${sourceDocNo}-${sourceLineNo}`;
  });
  trip.totalWeightTonne = lines.reduce((sum, line) => sum + numberValue(line, 'WeightTonne', 'weightTonne'), 0);
  trip.totalBags = lines.reduce((sum, line) => sum + numberValue(line, 'BagCount', 'bagCount'), 0);

  if (weighbridge) {
    const tareWeight = numberValue(weighbridge, 'TareWeight', 'tareWeight');
    const grossWeight = numberValue(weighbridge, 'GrossWeight', 'grossWeight');
    const netWeight = numberValue(weighbridge, 'NetWeight', 'netWeight') || (grossWeight - tareWeight);

    trip.weighbridge = {
      id: stringValue(weighbridge, 'systemId', 'id', 'EntryNo', 'entryNo', 'TripNo', 'tripNo'),
      apiId: extractApiId(weighbridge),
      entryNo: stringValue(weighbridge, 'EntryNo', 'entryNo'),
      tripId: stringValue(weighbridge, 'TripNo', 'tripNo'),
      tareWeight,
      grossWeight,
      netWeight,
      overload: netWeight > trip.truckCapacityTonne,
      recordedAt: stringValue(weighbridge, 'RecordedAt', 'recordedAt') || new Date().toISOString(),
      recordedBy: stringValue(weighbridge, 'RecordedBy', 'recordedBy'),
    };
  }

  if (pod) {
    trip.podReceived = true;
    trip.podDate = stringValue(pod, 'PodDate', 'podDate');
  }

  return trip;
}

export function mapWeighbridgeFromApi(dto: WeighbridgeEntryDto): WeighbridgeRecord {
  const tareWeight = numberValue(dto, 'TareWeight', 'tareWeight');
  const grossWeight = numberValue(dto, 'GrossWeight', 'grossWeight');
  const netWeight = numberValue(dto, 'NetWeight', 'netWeight') || (grossWeight - tareWeight);

  return {
    id: stringValue(dto, 'systemId', 'id', 'EntryNo', 'entryNo', 'TripNo', 'tripNo'),
    apiId: extractApiId(dto),
    entryNo: stringValue(dto, 'EntryNo', 'entryNo'),
    tripId: stringValue(dto, 'TripNo', 'tripNo'),
    tareWeight,
    grossWeight,
    netWeight,
    overload: false,
    recordedAt: stringValue(dto, 'RecordedAt', 'recordedAt') || new Date().toISOString(),
    recordedBy: stringValue(dto, 'RecordedBy', 'recordedBy'),
  };
}

export function mapTransporterSetupFromApi(dto: TransporterDto): TransporterSetup {
  return {
    apiId: extractApiId(dto),
    etag: stringValue(dto, '@odata.etag'),
    code: stringValue(dto, 'Code', 'code', 'No', 'no', 'id'),
    name: stringValue(dto, 'Name', 'name'),
    phoneNo: stringValue(dto, 'PhoneNo', 'phoneNo', 'Phone', 'phone', 'Contact', 'contact'),
    email: stringValue(dto, 'Email', 'email'),
    active: booleanValue(dto, 'Active', 'active'),
    defaultFreightType: stringValue(dto, 'DefaultFreightType', 'defaultFreightType')
      ? normalizeLoadType(stringValue(dto, 'DefaultFreightType', 'defaultFreightType'))
      : '',
    remarks: stringValue(dto, 'Remarks', 'remarks'),
  };
}

export function mapTruckSetupFromApi(dto: TruckDto): TruckSetup {
  return {
    apiId: extractApiId(dto),
    etag: stringValue(dto, '@odata.etag'),
    truckNo: stringValue(dto, 'TruckNo', 'truckNo', 'No', 'no', 'id'),
    transporterId: stringValue(dto, 'TransporterNo', 'transporterNo', 'TransporterCode', 'transporterCode', 'TransporterId', 'transporterId'),
    transporterName: stringValue(dto, 'TransporterName', 'transporterName'),
    plateNo: stringValue(dto, 'PlateNo', 'plateNo'),
    loadType: normalizeLoadType(stringValue(dto, 'LoadType', 'loadType')),
    capacityTonne: numberValue(dto, 'CapacityTonne', 'capacityTonne'),
    gpsEnabled: booleanValue(dto, 'GPSEnabled', 'gpsEnabled'),
    active: booleanValue(dto, 'Active', 'active'),
  };
}

export function mapFreightChargeSetupFromApi(dto: FreightChargeDto): FreightChargeSetup {
  return {
    apiId: extractApiId(dto),
    etag: stringValue(dto, '@odata.etag'),
    code: stringValue(dto, 'Code', 'code'),
    locationCode: stringValue(dto, 'LocationCode', 'locationCode'),
    region: stringValue(dto, 'Region', 'region'),
    loadType: normalizeLoadType(stringValue(dto, 'LoadType', 'loadType')),
    freightRate: numberValue(dto, 'FreightRate', 'freightRate'),
    handlingCharge: numberValue(dto, 'HandlingCharge', 'handlingCharge'),
    active: booleanValue(dto, 'Active', 'active'),
    remarks: stringValue(dto, 'Remarks', 'remarks'),
  };
}

export function buildTransporterPayload(item: TransporterSetup): Record<string, unknown> {
  return {
    Code: item.code,
    Name: item.name,
    PhoneNo: item.phoneNo,
    Email: item.email,
    Active: item.active,
    DefaultFreightType: item.defaultFreightType || null,
    Remarks: item.remarks,
  };
}

export function buildTruckPayload(item: TruckSetup): Record<string, unknown> {
  return {
    TruckNo: item.truckNo,
    TransporterCode: item.transporterId,
    PlateNo: item.plateNo,
    LoadType: item.loadType,
    CapacityTonne: item.capacityTonne,
    GPSEnabled: item.gpsEnabled,
    Active: item.active,
  };
}

export function buildFreightChargePayload(item: FreightChargeSetup): Record<string, unknown> {
  return {
    code: item.code || null,
    locationCode: item.locationCode,
    region: item.region,
    loadType: item.loadType,
    freightRate: item.freightRate,
    handlingCharge: item.handlingCharge,
    active: item.active,
    remarks: item.remarks,
  };
}

export function isGuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
