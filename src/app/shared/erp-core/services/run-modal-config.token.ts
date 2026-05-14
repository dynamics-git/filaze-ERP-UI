import { InjectionToken } from '@angular/core';
import { EntryDialogConfig, EntryHeaderSectionConfig } from '../models/entry-dialog-config.model';
import { DataSourceConfig } from '../models/data-source-config.model';
import { PopupMode, PopupSize } from '../models/popup-config.model';

export type RunModalContext = Record<string, unknown>;

export type RunModalConfigModule = {
  runModalMode?: PopupMode;
  runModalSize?: PopupSize;
  buildRunModalEntryDialogConfig?: (context: RunModalContext) => EntryDialogConfig;
  runModalValidateBeforeSave?: (args: {
    scope: 'header' | 'line';
    headerData: Record<string, unknown>;
    row?: Record<string, unknown>;
    payload: Record<string, unknown>;
    entryDialogConfig: EntryDialogConfig;
    context: RunModalContext;
  }) => string | void;
  runModalOnHeaderChanged?: (args: {
    headerData: Record<string, unknown>;
    fieldKey: string;
    payload: unknown;
  }) => void;
  runModalBuildHeaderPayload?: (args: {
    payload: Record<string, unknown>;
    headerData: Record<string, unknown>;
    headerSections: EntryHeaderSectionConfig[];
    entryDialogConfig: EntryDialogConfig;
    context: RunModalContext;
  }) => Record<string, unknown> | void;
  runModalRelation?: {
    parentEndpoint: string;
    childCollection: string;
    parentIdFields?: string[];
    top?: number;
  };
  runModalDataSource?: DataSourceConfig;
  [key: string]: unknown;
};

export type RunModalConfigResolver = (pageId: string) => Promise<RunModalConfigModule | undefined>;

export const RUN_MODAL_CONFIG_RESOLVER = new InjectionToken<RunModalConfigResolver>(
  'RUN_MODAL_CONFIG_RESOLVER'
);
