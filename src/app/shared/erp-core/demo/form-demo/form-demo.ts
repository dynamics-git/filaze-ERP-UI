import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ErpFormComponent } from '../../components/form/form';
import { ErpFieldConfig } from '../../models/field-config.model';

@Component({
  selector: 'erp-form-demo',
  standalone: true,
  imports: [ErpFormComponent, JsonPipe],
  templateUrl: './form-demo.html',
  styleUrl: './form-demo.scss'
})
export class ErpFormDemoComponent {
  readonly fields: ErpFieldConfig[] = [
    {
      key: 'vendorName',
      label: 'Vendor Name',
      type: 'text',
      required: true,
      placeholder: 'Enter vendor name',
      width: '260px'
    },
    {
      key: 'quantity',
      label: 'Quantity',
      type: 'number',
      width: '140px'
    },
    {
      key: 'postingDate',
      label: 'Posting Date',
      type: 'date',
      required: true,
      width: '170px'
    },
    {
      key: 'approved',
      label: 'Approved',
      type: 'boolean',
      width: '120px'
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'currency',
      width: '160px'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      width: '180px',
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Released', value: 'Released' }
      ]
    },
    {
      key: 'itemNo',
      label: 'Item Lookup',
      type: 'lookup',
      placeholder: 'Search item',
      width: '260px',
      lookup: {
        endpoint: '/items',
        valueField: 'No',
        displayField: 'Description',
        searchFields: ['No', 'Description'],
        allowOpenCard: true
      }
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Enter notes',
      width: '100%'
    }
  ];

  formValue: Record<string, unknown> = {
    vendorName: 'Northwind Traders',
    quantity: 12,
    postingDate: '2026-05-09',
    approved: false,
    amount: 18420,
    status: 'Open',
    itemNo: 'CHAIR-001',
    notes: 'Temporary ERP form demo value.'
  };

  updateValue(value: Record<string, unknown>): void {
    this.formValue = value;
  }

  logFieldChange(event: { key: string; value: unknown }): void {
    console.log('ERP form demo field change', event);
  }
}
