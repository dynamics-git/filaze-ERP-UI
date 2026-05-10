import { Component } from '@angular/core';
import { ErpCommandBarComponent } from '../../components/command-bar/command-bar';
import { ErpDataSurfaceComponent } from '../../components/data-surface/data-surface';
import { ErpFactboxHostComponent } from '../../components/factbox-host/factbox-host';
import { ErpShellComponent } from '../../components/shell/shell';
import {
  erpCommandBarSampleCommands,
  erpCommandBarSampleStandardActions
} from '../../configs/command-bar-sample.config';
import { ErpDataSurfaceConfig } from '../../models/data-surface-config.model';
import { ErpFactboxConfig } from '../../models/factbox-config.model';

type ShellDemoRow = {
  no: string;
  name: string;
  accountType: string;
  postingType: string;
  category: string;
  dimension: string;
  balance: number;
  status: string;
  modified: string;
};

@Component({
  selector: 'erp-shell-demo',
  standalone: true,
  imports: [
    ErpShellComponent,
    ErpCommandBarComponent,
    ErpDataSurfaceComponent,
    ErpFactboxHostComponent
  ],
  templateUrl: './shell-demo.html',
  styleUrl: './shell-demo.scss'
})
export class ErpShellDemoComponent {
  readonly standardActions = erpCommandBarSampleStandardActions;
  readonly commands = erpCommandBarSampleCommands;

  readonly dataSurfaceConfig: ErpDataSurfaceConfig = {
    id: 'erp-shell-demo-accounts',
    mode: 'table',
    idField: 'no',
    selectable: true,
    columns: [
      { id: 'no', label: 'No.', type: 'text', isPrimary: true, width: '90px' },
      { id: 'name', label: 'Name', type: 'text', width: '240px' },
      { id: 'accountType', label: 'Type', type: 'text', width: '120px' },
      { id: 'postingType', label: 'Posting', type: 'text', width: '140px' },
      { id: 'category', label: 'Category', type: 'text', width: '120px' },
      { id: 'dimension', label: 'Dimension', type: 'text', width: '120px' },
      { id: 'balance', label: 'Balance', type: 'currency', currencyCode: 'MYR', align: 'end', width: '150px' },
      { id: 'status', label: 'Status', type: 'badge', width: '120px' },
      { id: 'modified', label: 'Modified', type: 'date', width: '140px' }
    ]
  };

  readonly factboxConfig: ErpFactboxConfig = {
    id: 'erp-shell-demo-factbox',
    title: 'Account details',
    subtitle: 'Factbox',
    width: '324px',
    sections: [
      {
        id: 'account-card',
        title: 'Account Card',
        badges: [{ id: 'status', field: 'status', tone: 'success' }],
        fields: [
          { id: 'no', label: 'Account No.', field: 'no' },
          { id: 'name', label: 'Name', field: 'name' },
          { id: 'accountType', label: 'Account Type', field: 'accountType' },
          { id: 'postingType', label: 'Posting Type', field: 'postingType' }
        ]
      },
      {
        id: 'financials',
        title: 'Financials',
        fields: [
          { id: 'category', label: 'Category', field: 'category' },
          { id: 'balance', label: 'Balance', field: 'formattedBalance' },
          { id: 'dimension', label: 'Dimension', field: 'dimension' }
        ]
      },
      {
        id: 'audit',
        title: 'Audit',
        fields: [
          { id: 'modified', label: 'Modified', field: 'modifiedLabel' },
          { id: 'owner', label: 'Owner', field: 'owner' }
        ]
      }
    ]
  };

  readonly rows: ShellDemoRow[] = [
    {
      no: '1110',
      name: 'Main bank account',
      accountType: 'Posting',
      postingType: 'Bank account',
      category: 'Cash',
      dimension: 'FIN-001',
      balance: 245800,
      status: 'Active',
      modified: '2026-05-06'
    },
    {
      no: '2110',
      name: 'Trade payables',
      accountType: 'Posting',
      postingType: 'Vendor',
      category: 'Liability',
      dimension: 'FIN-AP',
      balance: -4600,
      status: 'Active',
      modified: '2026-05-05'
    },
    {
      no: '3100',
      name: 'Sales revenue',
      accountType: 'Posting',
      postingType: 'Revenue',
      category: 'Income',
      dimension: 'SALES',
      balance: 984000,
      status: 'Released',
      modified: '2026-05-04'
    }
  ];

  selectedRecord = this.toFactboxRecord(this.rows[0]);

  logCommand(event: { actionKey: string; payload?: unknown }): void {
    console.log('ERP shell demo command', event);
  }

  selectRow(row: unknown): void {
    const selected = row as ShellDemoRow;
    this.selectedRecord = this.toFactboxRecord(selected);
    console.log('ERP shell demo row selected', selected);
  }

  private toFactboxRecord(row: ShellDemoRow): ShellDemoRow & {
    formattedBalance: string;
    modifiedLabel: string;
    owner: string;
  } {
    return {
      ...row,
      formattedBalance: new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'MYR'
      }).format(row.balance),
      modifiedLabel: new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      }).format(new Date(row.modified)),
      owner: 'AD'
    };
  }
}
