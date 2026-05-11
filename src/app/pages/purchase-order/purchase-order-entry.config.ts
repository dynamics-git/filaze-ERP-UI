import { ErpEntryDialogConfig } from '../../shared/erp-core/models/entry-dialog-config.model';
import {
  DEFAULT_ENTRY_HEADER_DATA,
  DEFAULT_ENTRY_HEADER_SECTIONS,
  DEFAULT_ENTRY_LINE_COLUMNS,
  DEFAULT_ENTRY_LINE_ROWS,
  DEFAULT_ENTRY_LINE_TOTALS
} from '../../layout/entry-dialog/entry-dialog.defaults';

const FALLBACK_TITLE = 'Account journal';
const FALLBACK_SUBTITLE = 'General ledger · Cronus International Ltd.';

export function buildPurchaseOrderEntryDialogConfig(row?: unknown): ErpEntryDialogConfig {
  const record = isRecord(row) ? row : {};

  return {
    pageLabel: 'PAGE',
    title: FALLBACK_TITLE,
    subtitle: FALLBACK_SUBTITLE,
    headerSections: DEFAULT_ENTRY_HEADER_SECTIONS,
    headerData: {
      ...DEFAULT_ENTRY_HEADER_DATA,
      journalNo: toText(record['Number']) || DEFAULT_ENTRY_HEADER_DATA['journalNo'],
      postingDate: toText(record['PostingDate']) || DEFAULT_ENTRY_HEADER_DATA['postingDate'],
      description: toText(record['BuyFromVendorName']) || DEFAULT_ENTRY_HEADER_DATA['description'],
      currency: toText(record['CurrencyCode']) || DEFAULT_ENTRY_HEADER_DATA['currency'],
      payToBillToName: toText(record['BuyFromVendorName']) || DEFAULT_ENTRY_HEADER_DATA['payToBillToName']
    },
    lineColumns: DEFAULT_ENTRY_LINE_COLUMNS,
    lineRows: DEFAULT_ENTRY_LINE_ROWS,
    lineTotals: DEFAULT_ENTRY_LINE_TOTALS
  };
}

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}