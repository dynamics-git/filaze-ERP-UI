import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

export type ErpListPageColumnConfig = {
  id: string;
  label: string;
  field?: string;
  type?: string;
  align?: 'start' | 'center' | 'end';
  isPrimary?: boolean;
  subtitleField?: string;
  width?: string;
};

export type ErpListPageConfig = {
  id?: string;
  title?: string;
  subtitle?: string;
  pageType?: string;
  views?: unknown[];
  activeViewId?: string;
  tools?: unknown;
  standardActions?: unknown;
  commands?: unknown[];
  dataSurface?: {
    idField?: string;
    columns?: ErpListPageColumnConfig[];
  };
  factbox?: {
    label?: string;
    title?: string;
    subtitle?: string;
    sections?: Array<{
      id?: string;
      title: string;
      fields?: Array<{
        id?: string;
        label: string;
        field?: string;
      }>;
    }>;
  };
} & Record<string, unknown>;

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

type DisplayColumn = ErpListPageColumnConfig & {
  primary?: boolean;
  sortable?: boolean;
  filterable?: boolean;
};

@Component({
  selector: 'erp-list-page',
  standalone: true,
  imports: [],
  templateUrl: './list-page.html',
  styleUrl: './list-page.scss'
})
export class ErpListPageComponent implements AfterViewChecked {
  @ViewChild('gridScroll') private readonly gridScroll?: ElementRef<HTMLElement>;

  @Input() config?: ErpListPageConfig;
  @Input() data: unknown[] = [];
  @Input() hasMore = false;
  @Input() loading = false;
  @Input() selectedRecord?: unknown;
  @Output() loadMore = new EventEmitter<void>();
  @Output() rowSelected = new EventEmitter<unknown>();
  @Output() primaryAction = new EventEmitter<unknown>();
  @Output() selectionChanged = new EventEmitter<unknown>();
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  selectedAccountNo = '1110';
  selectedNos = new Set<string>(['1110']);
  private autoLoadCheckQueued = false;

  readonly defaultColumns: DisplayColumn[] = [
    { id: 'no', label: 'No.', field: 'no', type: 'text', primary: true, isPrimary: true },
    { id: 'name', label: 'Name', field: 'name', type: 'text', subtitleField: 'sub', sortable: true },
    { id: 'accountType', label: 'Account type', field: 'accountType', type: 'text' },
    { id: 'postingType', label: 'Posting type', field: 'postingType', type: 'text' },
    { id: 'category', label: 'Category', field: 'category', type: 'text' },
    { id: 'dimension', label: 'Dimension', field: 'dimension', type: 'text' },
    { id: 'balance', label: 'Balance', field: 'balance', type: 'currency', align: 'end', sortable: true },
    { id: 'directPosting', label: 'Direct', field: 'directPosting', type: 'text' },
    { id: 'recon', label: 'Reconcile', field: 'recon', type: 'text' },
    { id: 'modified', label: 'Modified', field: 'modified', type: 'text', sortable: true },
    { id: 'status', label: 'Status', field: 'status', type: 'badge' }
  ];

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

  get usesConfiguredData(): boolean {
    return Boolean(this.config?.dataSurface);
  }

  get rows(): unknown[] {
    if (this.usesConfiguredData) {
      return this.data;
    }

    return this.data.length > 0 ? this.data : this.accounts;
  }

  get isInitialLoading(): boolean {
    return this.loading && this.rows.length === 0;
  }

  get isLoadingMore(): boolean {
    return this.loading && this.rows.length > 0;
  }

  get columns(): DisplayColumn[] {
    return this.config?.dataSurface?.columns?.length ? this.config.dataSurface.columns : this.defaultColumns;
  }

  get selectedRow(): unknown {
    return this.selectedRecord ?? this.rows[0] ?? (this.usesConfiguredData ? undefined : this.selectedAccount);
  }

  get selectedCount(): number {
    if (this.usesConfiguredData || this.data.length > 0) {
      return 0;
    }

    return this.selectedNos.size;
  }

  get selectedRegion(): string {
    return this.selectedAccount.dimension === 'SALES' ? 'Singapore' : 'Malaysia';
  }

  clearSelection(): void {
    this.selectedNos.clear();
  }

  getRowKey(row: unknown): string {
    const keyField = this.config?.dataSurface?.idField;

    if (keyField) {
      return String(this.read(row, keyField) ?? '');
    }

    return String(this.read(row, 'no') ?? this.read(row, 'Number') ?? this.read(row, 'No') ?? this.read(row, 'Id') ?? '');
  }

  getSelectedRowKey(): string {
    return this.getRowKey(this.selectedRow);
  }

  getRowType(row: unknown): string {
    return String(this.read(row, 'accountType') ?? this.read(row, 'Type') ?? 'Posting');
  }

  getStatus(row: unknown): string {
    return String(this.read(row, 'status') ?? this.read(row, 'Status') ?? (this.usesConfiguredData ? '-' : 'Active'));
  }

  getTone(row: unknown): string {
    return String(this.read(row, 'tone') ?? 'positive');
  }

  getRowIcon(row: unknown): string {
    return this.getRowType(row) === 'Heading' ? 'bi bi-chevron-down' : 'bi bi-chevron-right';
  }

  isRowChecked(row: unknown): boolean {
    return this.selectedNos.has(this.getRowKey(row));
  }

  toggleRow(row: unknown, event: Event): void {
    event.stopPropagation();
    const key = this.getRowKey(row);

    if (!key) {
      return;
    }

    if (this.selectedNos.has(key)) {
      this.selectedNos.delete(key);
    } else {
      this.selectedNos.add(key);
    }

    this.selectRow(row);
  }

  selectRow(row: unknown): void {
    const key = this.getRowKey(row);

    if (key) {
      this.selectedAccountNo = key;
    }

    this.selectedRecord = row;
    this.selectionChanged.emit(row);
    this.rowSelected.emit(row);
  }

  openPrimary(row: unknown, event: Event): void {
    event.stopPropagation();
    this.selectRow(row);
    this.primaryAction.emit(row);
  }

  ngAfterViewChecked(): void {
    if (!this.usesConfiguredData || this.loading || !this.hasMore || this.autoLoadCheckQueued) {
      return;
    }

    this.autoLoadCheckQueued = true;
    queueMicrotask(() => {
      this.autoLoadCheckQueued = false;
      this.requestMoreIfGridNeedsRows();
    });
  }

  onGridScroll(event: Event): void {
    if (!this.usesConfiguredData || this.loading || !this.hasMore) {
      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceFromBottom <= 160) {
      this.loadMore.emit();
    }
  }

  private requestMoreIfGridNeedsRows(): void {
    if (!this.usesConfiguredData || this.loading || !this.hasMore) {
      return;
    }

    const element = this.gridScroll?.nativeElement;

    if (!element) {
      return;
    }

    if (element.scrollHeight <= element.clientHeight + 80) {
      this.loadMore.emit();
    }
  }

  getCellValue(row: unknown, column: DisplayColumn): string {
    const value = this.read(row, column.field ?? column.id);

    if (this.usesConfiguredData && (value === undefined || value === null || value === '')) {
      return '';
    }

    return this.formatValue(value, column);
  }

  getSubtitle(row: unknown, column: DisplayColumn): string {
    const value = this.read(row, column.subtitleField ?? '');
    return value === undefined || value === null ? '' : String(value);
  }

  getFactboxLabel(): string {
    return this.config?.factbox?.subtitle ?? this.config?.factbox?.label ?? 'Account card';
  }

  getFactboxTitle(): string {
    return String(
      this.read(this.selectedRow, 'name') ??
      this.config?.factbox?.title ??
      this.read(this.selectedRow, 'BuyFromVendorName') ??
      'Details'
    );
  }

  getFactboxSubtitle(): string {
    if (this.usesConfiguredData || this.data.length > 0) {
      return '';
    }

    const accountNo = this.read(this.selectedRow, 'no') ?? this.read(this.selectedRow, 'Number') ?? this.read(this.selectedRow, 'No');

    return accountNo ? `Account ${accountNo}` : (this.config?.factbox?.subtitle ?? '');
  }

  getFactboxSummaryValue(): string {
    return this.formatValue(
      this.read(this.selectedRow, 'balance') ?? this.read(this.selectedRow, 'AmountIncludingVAT') ?? '-',
      { id: 'summary', label: 'Summary', type: 'currency' }
    );
  }

  getFactboxSections(): Array<{ title: string; fields: Array<{ label: string; field?: string }> }> {
    if (this.config?.factbox?.sections?.length) {
      return this.config.factbox.sections.map((section) => ({
        title: section.title,
        fields: section.fields ?? []
      }));
    }

    return [
      {
        title: 'Financials',
        fields: [
          { label: 'Net change', field: 'balance' },
          { label: 'Statement class', field: 'category' },
          { label: 'Currency', field: 'CurrencyCode' }
        ]
      },
      {
        title: 'Posting',
        fields: [
          { label: 'Posting type', field: 'postingType' },
          { label: 'Direct posting', field: 'directPosting' },
          { label: 'Department', field: 'dimension' }
        ]
      },
      {
        title: 'Workflow',
        fields: [
          { label: 'Approval policy' },
          { label: 'Reconciliation', field: 'recon' }
        ]
      },
      {
        title: 'Audit',
        fields: [
          { label: 'Last modified', field: 'modified' },
          { label: 'Modified by' }
        ]
      },
      {
        title: 'Controls',
        fields: [
          { label: 'Account category', field: 'category' },
          { label: 'Posting group', field: 'postingType' },
          { label: 'Blocked', field: 'status' }
        ]
      },
      {
        title: 'Dimensions',
        fields: [
          { label: 'Business unit', field: 'dimension' },
          { label: 'Cost center', field: 'dimension' },
          { label: 'Region' }
        ]
      },
      {
        title: 'Recent activity',
        fields: [
          { label: 'Last posting' },
          { label: 'Last reconciled' },
          { label: 'Open entries' }
        ]
      }
    ];
  }

  getFactboxFieldValue(field: { label: string; field?: string }): string {
    if (field.field) {
      return this.formatValue(this.read(this.selectedRow, field.field), { id: field.field, label: field.label });
    }

    const defaults: Record<string, string> = {
      'Approval policy': 'Required',
      'Modified by': 'AD',
      'Region': this.selectedRegion,
      'Last posting': 'Receipt journal',
      'Last reconciled': 'Today',
      'Open entries': '12'
    };

    return defaults[field.label] ?? '-';
  }

  private formatValue(value: unknown, column: { type?: string } & Record<string, unknown>): string {
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    if (column.type === 'date' && typeof value === 'string') {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }).format(date);
      }
    }

    if (column.type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        currencyDisplay: 'code'
      }).format(value);
    }

    return String(value);
  }

  private read(row: unknown, field: string): unknown {
    if (!field || typeof row !== 'object' || row === null) {
      return undefined;
    }

    return (row as Record<string, unknown>)[field];
  }
}
