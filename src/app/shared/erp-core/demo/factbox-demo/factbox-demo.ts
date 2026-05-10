import { Component } from '@angular/core';
import { ErpFactboxHostComponent } from '../../components/factbox-host/factbox-host';
import { ErpFactboxConfig } from '../../models/factbox-config.model';

@Component({
  selector: 'erp-factbox-demo',
  standalone: true,
  imports: [ErpFactboxHostComponent],
  templateUrl: './factbox-demo.html',
  styleUrl: './factbox-demo.scss'
})
export class ErpFactboxDemoComponent {
  readonly config: ErpFactboxConfig = {
    id: 'erp-factbox-demo',
    title: 'Main bank account',
    subtitle: 'Account Card',
    width: '324px',
    sections: [
      {
        id: 'account-card',
        title: 'Account Card',
        subtitle: 'Core record details',
        badges: [
          {
            id: 'status',
            field: 'status',
            tone: 'success'
          }
        ],
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
        badges: [
          {
            id: 'category',
            field: 'category',
            tone: 'neutral'
          }
        ],
        fields: [
          { id: 'balance', label: 'Current Balance', field: 'balance' },
          { id: 'netChange', label: 'Net Change', field: 'netChange' },
          { id: 'currency', label: 'Currency', field: 'currency' }
        ]
      },
      {
        id: 'workflow',
        title: 'Workflow',
        badges: [
          {
            id: 'approvalStatus',
            field: 'approvalStatus',
            tone: 'warning'
          }
        ],
        fields: [
          { id: 'approvalPolicy', label: 'Approval Policy', field: 'approvalPolicy' },
          { id: 'reconciliation', label: 'Reconciliation', field: 'reconciliation' },
          { id: 'blocked', label: 'Blocked', field: 'blocked' }
        ]
      },
      {
        id: 'audit',
        title: 'Audit',
        fields: [
          { id: 'modified', label: 'Last Modified', field: 'audit.modified' },
          { id: 'modifiedBy', label: 'Modified By', field: 'audit.modifiedBy' }
        ]
      },
      {
        id: 'dimensions',
        title: 'Dimensions',
        fields: [
          { id: 'businessUnit', label: 'Business Unit', field: 'dimensions.businessUnit' },
          { id: 'costCenter', label: 'Cost Center', field: 'dimensions.costCenter' },
          { id: 'region', label: 'Region', field: 'dimensions.region' }
        ]
      }
    ]
  };

  readonly selectedRecord = {
    no: '1110',
    name: 'Main bank account',
    accountType: 'Posting',
    postingType: 'Bank account',
    category: 'Cash',
    balance: 'RM 245,800.00',
    netChange: 'RM 12,420.00',
    currency: 'MYR',
    status: 'Active',
    approvalStatus: 'Pending Review',
    approvalPolicy: 'Required',
    reconciliation: 'Due today',
    blocked: 'No',
    audit: {
      modified: '06 May 2026',
      modifiedBy: 'AD'
    },
    dimensions: {
      businessUnit: 'Corporate',
      costCenter: 'FIN-001',
      region: 'Malaysia'
    }
  };
}
