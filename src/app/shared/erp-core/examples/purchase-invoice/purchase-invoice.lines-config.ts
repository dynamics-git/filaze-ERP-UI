import { ErpDataSourceConfig } from '../../models/data-source-config.model';
import { ErpDataSurfaceConfig } from '../../models/data-surface-config.model';
import { ErpLineConfig } from '../../models/line-config.model';

export type PurchaseInvoiceLinesConfig = ErpLineConfig & ErpDataSurfaceConfig & {
  dataSource: ErpDataSourceConfig;
};

export const purchaseInvoiceLinesConfig: PurchaseInvoiceLinesConfig = {
  id: 'purchase-invoice-lines',
  mode: 'documentLines',
  idField: 'SystemId',
  lineKeyField: 'SystemId',
  parentKeyField: 'DocumentNo',
  selectable: true,
  multiSelect: true,
  editable: true,
  supportsSubLines: false,
  lineType: 'generic',
  dataSource: {
    endpoint: '/purchaseInvoiceLines',
    keyField: 'SystemId',
    parentKeyField: 'DocumentNo',
    documentNoField: 'No',
    defaultSort: 'LineNo',
    pageSize: 50,
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true
  },
  columns: [
    { id: 'Type', label: 'Type', type: 'text', width: '130px' },
    { id: 'No', label: 'No', type: 'text', isPrimary: true, width: '120px' },
    { id: 'Description', label: 'Description', type: 'text', width: '280px' },
    { id: 'Quantity', label: 'Quantity', type: 'number', align: 'end', width: '110px' },
    {
      id: 'DirectUnitCost',
      label: 'Direct Unit Cost',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end',
      width: '150px'
    },
    {
      id: 'LineAmount',
      label: 'Line Amount',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end',
      width: '140px'
    },
    { id: 'VATPercent', label: 'VAT %', type: 'number', align: 'end', width: '90px' },
    { id: 'DimensionSetID', label: 'Dimension Set ID', type: 'number', align: 'end', width: '150px' }
  ]
};
