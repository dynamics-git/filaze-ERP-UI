import { Component, inject } from '@angular/core';
import { ErpCommandBarComponent } from '../../components/command-bar/command-bar';
import { ErpDataSurfaceComponent } from '../../components/data-surface/data-surface';
import { ErpFactboxHostComponent } from '../../components/factbox-host/factbox-host';
import { ErpPopupHostComponent } from '../../components/popup-host/popup-host';
import { ErpCommandConfig, ErpStandardCommandConfig } from '../../models/command-config.model';
import { ErpDataSurfaceConfig } from '../../models/data-surface-config.model';
import { ErpFactboxConfig } from '../../models/factbox-config.model';
import { PopupStackService } from '../../services/popup-stack.service';

type PurchaseLine = {
  lineNo: string;
  type: string;
  description: string;
  quantity: number;
  unitCost: number;
  amount: number;
  location: string;
  status: string;
};

@Component({
  selector: 'erp-document-page-demo',
  standalone: true,
  imports: [
    ErpCommandBarComponent,
    ErpDataSurfaceComponent,
    ErpFactboxHostComponent,
    ErpPopupHostComponent
  ],
  templateUrl: './document-page-demo.html',
  styleUrl: './document-page-demo.scss'
})
export class ErpDocumentPageDemoComponent {
  private readonly popupStack = inject(PopupStackService);

  readonly standardActions: ErpStandardCommandConfig = {
    new: true,
    delete: true,
    refresh: true
  };

  readonly commands: ErpCommandConfig[] = [
    {
      id: 'process',
      label: 'Process',
      type: 'menu',
      group: 'process',
      actionKey: 'process'
    },
    {
      id: 'post',
      label: 'Post',
      type: 'menu',
      group: 'post',
      actionKey: 'post'
    },
    {
      id: 'release',
      label: 'Release',
      type: 'normal',
      group: 'process',
      actionKey: 'release'
    }
  ];

  readonly document = {
    no: 'PI-10027',
    vendor: 'Northwind Traders',
    postingDate: '2026-05-09',
    status: 'Open',
    amount: 'RM 18,420.00'
  };

  readonly lineConfig: ErpDataSurfaceConfig = {
    id: 'purchase-lines',
    mode: 'table',
    idField: 'lineNo',
    selectable: true,
    columns: [
      { id: 'lineNo', label: 'Line', type: 'text', isPrimary: true, width: '90px' },
      { id: 'type', label: 'Type', type: 'text', width: '120px' },
      { id: 'description', label: 'Description', type: 'text', width: '260px' },
      { id: 'quantity', label: 'Qty', type: 'number', align: 'end', width: '90px' },
      { id: 'unitCost', label: 'Unit Cost', type: 'currency', currencyCode: 'MYR', align: 'end', width: '130px' },
      { id: 'amount', label: 'Amount', type: 'currency', currencyCode: 'MYR', align: 'end', width: '140px' },
      { id: 'location', label: 'Location', type: 'text', width: '120px' },
      { id: 'status', label: 'Status', type: 'badge', width: '120px' }
    ]
  };

  readonly factboxConfig: ErpFactboxConfig = {
    id: 'purchase-line-factbox',
    title: 'Line details',
    subtitle: 'Purchase document',
    width: '324px',
    sections: [
      {
        id: 'line',
        title: 'Line',
        badges: [{ id: 'status', field: 'status', tone: 'success' }],
        fields: [
          { id: 'lineNo', label: 'Line No.', field: 'lineNo' },
          { id: 'type', label: 'Type', field: 'type' },
          { id: 'description', label: 'Description', field: 'description' }
        ]
      },
      {
        id: 'amounts',
        title: 'Amounts',
        fields: [
          { id: 'quantity', label: 'Quantity', field: 'quantity' },
          { id: 'unitCostLabel', label: 'Unit Cost', field: 'unitCostLabel' },
          { id: 'amountLabel', label: 'Amount', field: 'amountLabel' }
        ]
      },
      {
        id: 'tracking',
        title: 'Tracking',
        fields: [
          { id: 'location', label: 'Location', field: 'location' },
          { id: 'documentNo', label: 'Document No.', field: 'documentNo' },
          { id: 'vendor', label: 'Vendor', field: 'vendor' }
        ]
      }
    ]
  };

  readonly lines: PurchaseLine[] = [
    {
      lineNo: '10000',
      type: 'Item',
      description: 'Office chairs',
      quantity: 12,
      unitCost: 420,
      amount: 5040,
      location: 'MAIN',
      status: 'Open'
    },
    {
      lineNo: '20000',
      type: 'G/L Account',
      description: 'Installation services',
      quantity: 1,
      unitCost: 2800,
      amount: 2800,
      location: 'SERV',
      status: 'Open'
    },
    {
      lineNo: '30000',
      type: 'Item',
      description: 'Monitor arms',
      quantity: 34,
      unitCost: 310,
      amount: 10540,
      location: 'MAIN',
      status: 'Pending'
    }
  ];

  selectedLine = this.toFactboxRecord(this.lines[0]);

  logCommand(event: { actionKey: string; payload?: unknown }): void {
    console.log('ERP document page demo command', event);
  }

  selectLine(row: unknown): void {
    this.selectedLine = this.toFactboxRecord(row as PurchaseLine);
    console.log('ERP document page demo line selected', row);
  }

  openLinePopup(): void {
    this.popupStack.open({
      id: `document-line-popup-${Date.now()}`,
      title: 'Line Popup',
      size: 'md',
      mode: 'modal',
      allowNested: true,
      closeOnBackdrop: false,
      data: {
        body: `Temporary line popup for ${this.selectedLine.lineNo} - ${this.selectedLine.description}.`
      }
    });
  }

  private toFactboxRecord(line: PurchaseLine): PurchaseLine & {
    unitCostLabel: string;
    amountLabel: string;
    documentNo: string;
    vendor: string;
  } {
    return {
      ...line,
      unitCostLabel: this.formatCurrency(line.unitCost),
      amountLabel: this.formatCurrency(line.amount),
      documentNo: this.document.no,
      vendor: this.document.vendor
    };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'MYR'
    }).format(value);
  }
}
