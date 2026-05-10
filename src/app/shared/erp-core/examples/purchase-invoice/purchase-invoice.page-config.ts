import { ErpDocumentPageConfig } from '../../models/document-page-config.model';
import { purchaseInvoiceCommandsConfig } from './purchase-invoice.commands-config';
import { purchaseInvoiceFactboxConfig } from './purchase-invoice.factbox-config';
import { purchaseInvoiceHeaderConfig } from './purchase-invoice.header-config';
import { purchaseInvoiceLinesConfig } from './purchase-invoice.lines-config';

export type PurchaseInvoicePageConfig = ErpDocumentPageConfig & {
  id: string;
  dataSurface: typeof purchaseInvoiceLinesConfig;
};

export const purchaseInvoicePageConfig: PurchaseInvoicePageConfig = {
  id: 'purchase-invoice',
  title: 'Purchase Invoice',
  subtitle: 'Example ERP document config',
  pageType: 'document',
  commands: purchaseInvoiceCommandsConfig,
  header: purchaseInvoiceHeaderConfig,
  lines: purchaseInvoiceLinesConfig,
  dataSource: purchaseInvoiceHeaderConfig.dataSource,
  dataSurface: purchaseInvoiceLinesConfig,
  factbox: purchaseInvoiceFactboxConfig
};
