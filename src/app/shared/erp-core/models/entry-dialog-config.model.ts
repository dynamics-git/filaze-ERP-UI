import { FormSectionConfig } from './field-config.model';
import { LineColumnConfig } from './line-config.model';

export type EntryDialogType = 'header' | 'dimensions' | 'attachments' | 'line' | 'posting';

export interface EntryHeaderSectionConfig extends FormSectionConfig {
  metaText?: string;
  actionLabel?: string;
  actionDialog?: EntryDialogType;
}

export interface EntryLineTotalsConfig {
  subtotal: string;
  sst: string;
  total: string;
  difference: string;
}

export interface EntryAttachmentsConfig {
  headerFilesCount: number;
  lineFilesCount: number;
  canUpload: boolean;
  primaryActionLabel: string;
  primaryActionKey: string;
  context?: EntryAttachmentContextConfig;
}

export interface EntryAttachmentContextConfig {
  documentNoField?: string;
  documentType?: string;
  documentStatusField?: string;
  useSelectedLineForHeaderAttachments?: boolean;
  relatedDocumentNoField?: string;
  relatedDocumentType?: string;
  relatedLineNoField?: string;
}

export type EntryCommandTone = 'primary' | 'normal';
export type EntryRunModalMode = 'page' | 'modal' | 'drawer';
export type EntryRunModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type EntryRunModalTarget = 'entry' | 'list';

export interface EntryCommandBarConfig {
  maxPrimaryActions?: number;
  maxVisibleGroups?: number;
}

export interface EntryLineCommandPolicyConfig {
  injectDefaultLineNew?: boolean;
  injectDefaultLineDelete?: boolean;
}

export type EntryLinePlacementMode = 'end' | 'after-section';

export interface EntryLinePlacementConfig {
  mode?: EntryLinePlacementMode;
  afterSectionId?: string;
}

export interface EntryCommandButtonConfig {
  label: string;
  actionKey: string;
  group?: string;
  isPrimary?: boolean;
  order?: number;
  tone?: EntryCommandTone;
  icon?: string;
  trailingIcon?: string;
  disabled?: boolean;
  runModalPageId?: string;
  runModalMode?: EntryRunModalMode;
  runModalSize?: EntryRunModalSize;
  runModalTarget?: EntryRunModalTarget;
  runModalView?: EntryRunModalTarget;
}

export interface FactPanelRowConfig {
  label: string;
  value: string;
}

export interface FactPanelButtonConfig {
  label: string;
  actionKey: string;
  icon?: string;
  disabled?: boolean;
}

export interface FactPanelSectionConfig {
  id: string;
  title: string;
  rows?: FactPanelRowConfig[];
  buttons?: FactPanelButtonConfig[];
  customComponentKey?: string;
  customData?: Record<string, unknown>;
}

export type PopupFactPanelRowConfig = FactPanelRowConfig;
export type PopupFactPanelButtonConfig = FactPanelButtonConfig;
export type PopupFactPanelSectionConfig = FactPanelSectionConfig;

export type EntryStatusTone = 'info' | 'success' | 'warning' | 'error';

export interface EntryStatusMessage {
  tone: EntryStatusTone;
  title?: string;
  message: string;
}

export interface EntryDialogConfig {
  pageLabel?: string;
  title?: string;
  subtitle?: string;
  headerCommandBar?: EntryCommandBarConfig;
  lineCommandBar?: EntryCommandBarConfig;
  lineCommandPolicy?: EntryLineCommandPolicyConfig;
  linePlacement?: EntryLinePlacementConfig;
  headerToolbarButtons?: EntryCommandButtonConfig[];
  lineToolbarButtons?: EntryCommandButtonConfig[];
  detailToolbarButtons?: EntryCommandButtonConfig[];
  headerSections?: EntryHeaderSectionConfig[];
  headerData?: Record<string, unknown>;
  lineColumns?: LineColumnConfig[];
  lineRows?: Record<string, unknown>[];
  lineTotals?: EntryLineTotalsConfig;
  attachments?: EntryAttachmentsConfig;
  factPanelSections?: FactPanelSectionConfig[];
  statusMessage?: EntryStatusMessage;
}
