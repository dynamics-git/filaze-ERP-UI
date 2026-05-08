import { Component } from '@angular/core';

type AccountRow = {
  no: string;
  name: string;
  sub: string;
  accountType: string;
  postingType: string;
  balance: string;
  tone: 'positive' | 'negative';
  status: string;
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  readonly accounts: AccountRow[] = [
    {
      no: '1110',
      name: 'Main bank account',
      sub: 'Finance division',
      accountType: 'Posting',
      postingType: 'Bank account',
      balance: 'RM 245,800.00',
      tone: 'positive',
      status: 'Active'
    },
    {
      no: '2110',
      name: 'Trade payables',
      sub: 'Vendor control',
      accountType: 'Posting',
      postingType: 'Vendor',
      balance: 'RM -4,600.00',
      tone: 'negative',
      status: 'Active'
    },
    {
      no: '3100',
      name: 'Sales revenue',
      sub: 'Commercial operations',
      accountType: 'Posting',
      postingType: 'Revenue',
      balance: 'RM 984,000.00',
      tone: 'positive',
      status: 'Active'
    },
    ...Array.from({ length: 34 }, (_, index): AccountRow => {
      const code = 4100 + index * 10;
      const variants = [
        ['Operating expense control', 'Corporate finance', 'G/L account', 'RM 78,900.00', 'positive'],
        ['Regional sales clearing', 'Commercial ledger', 'Revenue', 'RM -12,450.00', 'negative'],
        ['Inventory adjustment', 'Warehouse operations', 'Inventory', 'RM 34,220.00', 'positive'],
        ['Payroll accrual', 'People operations', 'Accrual', 'RM -28,700.00', 'negative'],
        ['Project recoveries', 'Project accounting', 'Revenue', 'RM 52,640.00', 'positive'],
        ['Tax input control', 'Compliance ledger', 'Tax', 'RM 16,180.00', 'positive']
      ] as const;
      const item = variants[index % variants.length];

      return {
        no: String(code),
        name: item[0],
        sub: item[1],
        accountType: 'Posting',
        postingType: item[2],
        balance: item[3],
        tone: item[4],
        status: 'Active'
      };
    })
  ];
}
