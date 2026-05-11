import { ErpFormSectionConfig } from './field-config.model';
import { ErpLineColumnConfig } from './line-config.model';

export type ErpEntryDialogType = 'header' | 'dimensions' | 'attachments' | 'line' | 'posting';

export interface ErpEntryHeaderSectionConfig extends ErpFormSectionConfig {
  metaText?: string;
  actionLabel?: string;
  actionDialog?: ErpEntryDialogType;
}

export interface ErpEntryLineTotalsConfig {
  subtotal: string;
  sst: string;
  total: string;
  difference: string;
}

export interface ErpEntryDialogConfig {
  pageLabel?: string;
  title?: string;
  subtitle?: string;
  headerSections?: ErpEntryHeaderSectionConfig[];
  headerData?: Record<string, unknown>;
  lineColumns?: ErpLineColumnConfig[];
  lineRows?: Record<string, unknown>[];
  lineTotals?: ErpEntryLineTotalsConfig;
}