import { Component } from '@angular/core';

type AccountRow = {
  no: string;
  name: string;
  sub: string;
  accountType: 'Heading' | 'Posting' | 'Total';
  postingType: string;
  category: string;
  dimension: string;
  balance: string;
  tone: 'positive' | 'negative';
  directPosting: string;
  recon: string;
  modified: string;
  status: 'Active' | 'Blocked';
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage {
  selectedAccountNo = '1110';
  selectedNos = new Set<string>(['1110']);

  readonly accounts: AccountRow[] = [
    {
      no: '1000',
      name: 'Assets',
      sub: 'Statement group',
      accountType: 'Heading',
      postingType: '-',
      category: 'Asset',
      dimension: '-',
      balance: 'RM 1,264,600.00',
      tone: 'positive',
      directPosting: 'No',
      recon: '-',
      modified: '06 May',
      status: 'Active'
    },
    {
      no: '1110',
      name: 'Main bank account',
      sub: 'Finance division',
      accountType: 'Posting',
      postingType: 'Bank account',
      category: 'Cash',
      dimension: 'FIN-001',
      balance: 'RM 245,800.00',
      tone: 'positive',
      directPosting: 'Yes',
      recon: 'Due today',
      modified: '06 May',
      status: 'Active'
    },
    {
      no: '1999',
      name: 'Total assets',
      sub: 'Calculated total',
      accountType: 'Total',
      postingType: '-',
      category: 'Asset',
      dimension: '-',
      balance: 'RM 1,264,600.00',
      tone: 'positive',
      directPosting: 'No',
      recon: 'Reviewed',
      modified: '06 May',
      status: 'Active'
    },
    {
      no: '2000',
      name: 'Liabilities',
      sub: 'Statement group',
      accountType: 'Heading',
      postingType: '-',
      category: 'Liability',
      dimension: '-',
      balance: 'RM -33,300.00',
      tone: 'negative',
      directPosting: 'No',
      recon: '-',
      modified: '05 May',
      status: 'Active'
    },
    {
      no: '2110',
      name: 'Trade payables',
      sub: 'Vendor control',
      accountType: 'Posting',
      postingType: 'Vendor',
      category: 'Liability',
      dimension: 'FIN-AP',
      balance: 'RM -4,600.00',
      tone: 'negative',
      directPosting: 'No',
      recon: 'Monthly',
      modified: '05 May',
      status: 'Active'
    },
    {
      no: '3000',
      name: 'Income',
      sub: 'Statement group',
      accountType: 'Heading',
      postingType: '-',
      category: 'Income',
      dimension: '-',
      balance: 'RM 984,000.00',
      tone: 'positive',
      directPosting: 'No',
      recon: '-',
      modified: '04 May',
      status: 'Active'
    },
    {
      no: '3100',
      name: 'Sales revenue',
      sub: 'Commercial operations',
      accountType: 'Posting',
      postingType: 'Revenue',
      category: 'Income',
      dimension: 'SALES',
      balance: 'RM 984,000.00',
      tone: 'positive',
      directPosting: 'Yes',
      recon: 'Reviewed',
      modified: '04 May',
      status: 'Active'
    },
    ...Array.from({ length: 34 }, (_, index): AccountRow => {
      const code = 4100 + index * 10;
      const variants = [
        ['Operating expense control', 'Corporate finance', 'G/L account', 'Expense', 'FIN-OPEX', 'RM 78,900.00', 'positive', 'Yes', 'Monthly'],
        ['Regional sales clearing', 'Commercial ledger', 'Revenue', 'Income', 'SALES', 'RM -12,450.00', 'negative', 'Yes', 'Reviewed'],
        ['Inventory adjustment', 'Warehouse operations', 'Inventory', 'Asset', 'INV-MY', 'RM 34,220.00', 'positive', 'No', 'Weekly'],
        ['Payroll accrual', 'People operations', 'Accrual', 'Liability', 'HR-PAY', 'RM -28,700.00', 'negative', 'No', 'Month end'],
        ['Project recoveries', 'Project accounting', 'Revenue', 'Income', 'PRJ-REC', 'RM 52,640.00', 'positive', 'Yes', 'Reviewed'],
        ['Tax input control', 'Compliance ledger', 'Tax', 'Tax', 'TAX-MY', 'RM 16,180.00', 'positive', 'No', 'Quarterly']
      ] as const;
      const item = variants[index % variants.length];

      return {
        no: String(code),
        name: item[0],
        sub: item[1],
        accountType: 'Posting',
        postingType: item[2],
        category: item[3],
        dimension: item[4],
        balance: item[5],
        tone: item[6],
        directPosting: item[7],
        recon: item[8],
        modified: `${String((index % 27) + 1).padStart(2, '0')} May`,
        status: index % 11 === 7 ? 'Blocked' : 'Active'
      };
    })
  ];

  get selectedAccount(): AccountRow {
    return this.accounts.find((account) => account.no === this.selectedAccountNo) ?? this.accounts[1];
  }

  get selectedCount(): number {
    return this.selectedNos.size;
  }

  get selectedPostingGroup(): string {
    if (this.selectedAccount.postingType === 'Bank account') {
      return 'Local bank';
    }

    if (this.selectedAccount.postingType === 'Vendor') {
      return 'Trade vendor';
    }

    return this.selectedAccount.category;
  }

  get selectedBusinessUnit(): string {
    if (this.selectedAccount.dimension === 'SALES') {
      return 'Commercial';
    }

    if (this.selectedAccount.dimension.startsWith('HR')) {
      return 'People';
    }

    if (this.selectedAccount.dimension.startsWith('INV')) {
      return 'Warehouse';
    }

    return 'Corporate';
  }

  get selectedRegion(): string {
    return this.selectedAccount.dimension === 'SALES' ? 'Singapore' : 'Malaysia';
  }

  selectAccount(account: AccountRow): void {
    this.selectedAccountNo = account.no;
  }

  isChecked(account: AccountRow): boolean {
    return this.selectedNos.has(account.no);
  }

  toggleAccount(account: AccountRow, event: Event): void {
    event.stopPropagation();

    if (account.accountType !== 'Posting') {
      return;
    }

    if (this.selectedNos.has(account.no)) {
      this.selectedNos.delete(account.no);
    } else {
      this.selectedNos.add(account.no);
    }

    this.selectedAccountNo = account.no;
  }

  clearSelection(): void {
    this.selectedNos.clear();
  }
}
