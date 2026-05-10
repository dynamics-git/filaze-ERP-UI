import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ErpDataSurfaceComponent } from '../../components/data-surface/data-surface';
import { ErpFormComponent } from '../../components/form/form';
import { ErpDataSurfaceConfig } from '../../models/data-surface-config.model';
import { ErpFieldConfig } from '../../models/field-config.model';
import { PopupStackService } from '../../services/popup-stack.service';

type LineEditDemoRow = {
  lineNo: string;
  type: string;
  description: string;
  quantity: number;
  unitCost: number;
  amount: number;
  status: string;
};

@Component({
  selector: 'erp-line-edit-popup-demo',
  standalone: true,
  imports: [AsyncPipe, ErpDataSurfaceComponent, ErpFormComponent],
  templateUrl: './line-edit-popup-demo.html',
  styleUrl: './line-edit-popup-demo.scss'
})
export class ErpLineEditPopupDemoComponent {
  private readonly popupStack = inject(PopupStackService);

  readonly stack$ = this.popupStack.stack$;

  readonly lineConfig: ErpDataSurfaceConfig = {
    id: 'line-edit-popup-demo-lines',
    mode: 'table',
    idField: 'lineNo',
    selectable: true,
    columns: [
      { id: 'lineNo', label: 'Line', type: 'text', isPrimary: true, width: '90px' },
      { id: 'type', label: 'Type', type: 'text', width: '120px' },
      { id: 'description', label: 'Description', type: 'text', width: '260px' },
      { id: 'quantity', label: 'Quantity', type: 'number', align: 'end', width: '110px' },
      { id: 'unitCost', label: 'Unit Cost', type: 'currency', currencyCode: 'MYR', align: 'end', width: '130px' },
      { id: 'amount', label: 'Amount', type: 'currency', currencyCode: 'MYR', align: 'end', width: '140px' },
      { id: 'status', label: 'Status', type: 'badge', width: '120px' }
    ]
  };

  readonly rows: LineEditDemoRow[] = [
    {
      lineNo: '10000',
      type: 'Item',
      description: 'Office chairs',
      quantity: 12,
      unitCost: 420,
      amount: 5040,
      status: 'Open'
    },
    {
      lineNo: '20000',
      type: 'G/L Account',
      description: 'Installation services',
      quantity: 1,
      unitCost: 2800,
      amount: 2800,
      status: 'Open'
    },
    {
      lineNo: '30000',
      type: 'Item',
      description: 'Monitor arms',
      quantity: 34,
      unitCost: 310,
      amount: 10540,
      status: 'Pending'
    }
  ];

  readonly fields: ErpFieldConfig[] = [
    { key: 'lineNo', label: 'Line No.', type: 'text', readonly: true, width: '120px' },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      width: '180px',
      options: [
        { label: 'Item', value: 'Item' },
        { label: 'G/L Account', value: 'G/L Account' },
        { label: 'Resource', value: 'Resource' }
      ]
    },
    { key: 'description', label: 'Description', type: 'text', required: true, width: '260px' },
    { key: 'quantity', label: 'Quantity', type: 'number', required: true, width: '140px' },
    { key: 'unitCost', label: 'Unit Cost', type: 'currency', width: '160px' },
    { key: 'amount', label: 'Amount', type: 'currency', readonly: true, width: '160px' },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      width: '160px',
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Released', value: 'Released' }
      ]
    }
  ];

  formValue: Record<string, unknown> = {};

  openLinePopup(row: unknown): void {
    this.formValue = { ...(row as Record<string, unknown>) };
    this.popupStack.open({
      id: `line-edit-${this.formValue['lineNo'] ?? Date.now()}`,
      title: 'Edit Line',
      size: 'md',
      mode: 'modal',
      allowNested: false,
      closeOnBackdrop: false
    });
  }

  updateValue(value: Record<string, unknown>): void {
    this.formValue = value;
  }

  saveDraft(): void {
    console.log('ERP line edit popup draft', this.formValue);
  }

  close(): void {
    this.popupStack.closeTop();
  }
}
