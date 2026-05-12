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

export interface ErpEntryAttachmentsConfig {
  headerFilesCount: number;
  lineFilesCount: number;
  canUpload: boolean;
  primaryActionLabel: string;
  primaryActionKey: string;
}

export type ErpEntryCommandTone = 'primary' | 'normal';

export interface ErpEntryCommandBarConfig {
  maxPrimaryActions?: number;
  maxVisibleGroups?: number;
}

export type ErpEntryLinePlacementMode = 'end' | 'after-section';

export interface ErpEntryLinePlacementConfig {
  mode?: ErpEntryLinePlacementMode;
  afterSectionId?: string;
}

export interface ErpEntryCommandButtonConfig {
  label: string;
  actionKey: string;
  group?: string;
  isPrimary?: boolean;
  order?: number;
  tone?: ErpEntryCommandTone;
  icon?: string;
  trailingIcon?: string;
  disabled?: boolean;
}

export interface ErpFactPanelRowConfig {
  label: string;
  value: string;
}

export interface ErpFactPanelButtonConfig {
  label: string;
  actionKey: string;
  icon?: string;
  disabled?: boolean;
}

export interface ErpFactPanelSectionConfig {
  id: string;
  title: string;
  rows?: ErpFactPanelRowConfig[];
  buttons?: ErpFactPanelButtonConfig[];
  customComponentKey?: string;
  customData?: Record<string, unknown>;
}

export type ErpEntryStatusTone = 'info' | 'success' | 'warning' | 'error';

export interface ErpEntryStatusMessage {
  tone: ErpEntryStatusTone;
  title?: string;
  message: string;
}

export interface ErpEntryDialogConfig {
  pageLabel?: string;
  title?: string;
  subtitle?: string;
  headerCommandBar?: ErpEntryCommandBarConfig;
  lineCommandBar?: ErpEntryCommandBarConfig;
  linePlacement?: ErpEntryLinePlacementConfig;
  headerToolbarButtons?: ErpEntryCommandButtonConfig[];
  lineToolbarButtons?: ErpEntryCommandButtonConfig[];
  detailToolbarButtons?: ErpEntryCommandButtonConfig[];
  headerSections?: ErpEntryHeaderSectionConfig[];
  headerData?: Record<string, unknown>;
  lineColumns?: ErpLineColumnConfig[];
  lineRows?: Record<string, unknown>[];
  lineTotals?: ErpEntryLineTotalsConfig;
  attachments?: ErpEntryAttachmentsConfig;
  factPanelSections?: ErpFactPanelSectionConfig[];
  statusMessage?: ErpEntryStatusMessage;
}