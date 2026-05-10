import { Component } from '@angular/core';
import { ErpDataSurfaceComponent } from '../../components/data-surface/data-surface';
import { ErpDataSurfaceConfig } from '../../models/data-surface-config.model';

type DataSurfaceDemoRow = {
  no: string;
  name: string;
  quantity: number;
  postingDate: string;
  approved: boolean;
  balance: number;
  status: string;
};

@Component({
  selector: 'erp-data-surface-demo',
  standalone: true,
  imports: [ErpDataSurfaceComponent],
  templateUrl: './data-surface-demo.html',
  styleUrl: './data-surface-demo.scss'
})
export class ErpDataSurfaceDemoComponent {
  readonly config: ErpDataSurfaceConfig = {
    id: 'erp-data-surface-demo',
    mode: 'table',
    idField: 'no',
    selectable: true,
    columns: [
      {
        id: 'no',
        label: 'No.',
        type: 'text',
        isPrimary: true,
        width: '90px'
      },
      {
        id: 'name',
        label: 'Name',
        type: 'text',
        width: '240px'
      },
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'number',
        align: 'end',
        width: '120px'
      },
      {
        id: 'postingDate',
        label: 'Posting Date',
        type: 'date',
        width: '150px'
      },
      {
        id: 'approved',
        label: 'Approved',
        type: 'boolean',
        width: '120px'
      },
      {
        id: 'balance',
        label: 'Balance',
        type: 'currency',
        currencyCode: 'MYR',
        align: 'end',
        width: '150px'
      },
      {
        id: 'status',
        label: 'Status',
        type: 'badge',
        width: '130px'
      }
    ]
  };

  readonly rows: DataSurfaceDemoRow[] = [
    {
      no: '1000',
      name: 'Operating supplies',
      quantity: 42,
      postingDate: '2026-05-01',
      approved: true,
      balance: 12840.5,
      status: 'Active'
    },
    {
      no: '2000',
      name: 'Service accrual',
      quantity: 7,
      postingDate: '2026-05-03',
      approved: false,
      balance: -2350,
      status: 'Pending'
    },
    {
      no: '3000',
      name: 'Inventory adjustment',
      quantity: 128,
      postingDate: '2026-05-06',
      approved: true,
      balance: 76420,
      status: 'Released'
    }
  ];

  logSelectedRow(row: unknown): void {
    console.log('ERP data-surface demo row selected', row);
  }
}
