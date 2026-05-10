import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { SelectedItemService } from '../../../core/services/shared/selected-item.service';

interface RfqWorkbenchCheck {
  label: string;
  done: boolean;
}

interface RfqWorkbenchView {
  stage: string;
  guidance: string;
  actionLabel: string;
  actionName: 'sendInvite' | 'CompareQuote' | '';
  disabled: boolean;
  vendorCount: number;
  invitedCount: number;
  quoteCount: number;
  winnerCount: number;
}

interface RfqVendorView {
  rowIndex: number;
  vendorNo: string;
  vendorName: string;
  quotedAmount: number;
  deliveryDate: any;
  deliveryDays: number | null;
  quotationDate: Date;
  isInvited: boolean;
  isQuoted: boolean;
  isSelected: boolean;
  quoteNo: string;
  poNo: string;
  recommended: boolean;
  rank: number | null;
}

interface RfqCompareInsight {
  recommendation: string;
  bestPrice: string;
  bestVendor: string;
  delivery: string;
}

@Component({
  standalone: false,
  selector: 'app-rfq-workflow-factbox',
  templateUrl: './rfq-workflow-factbox.component.html',
  styleUrls: ['./rfq-workflow-factbox.component.scss']
})
export class RfqWorkflowFactboxComponent implements OnChanges {
  @Input() headerData: any;
  @Input() itemConfig: any;
  @Input() lineData: any[] = [];
  @Output() action = new EventEmitter<string>();

  vendorList: RfqVendorView[] = [];
  compareSelected: number[] = [];

  constructor(private selectedItemService: SelectedItemService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['headerData'] || changes['lineData'] || changes['itemConfig']) {
      this.calculateVendorSummary();
    }
  }

  get rfqWorkbenchChecks(): RfqWorkbenchCheck[] {
    return [
      { label: 'Vendor list prepared', done: this.vendorCount > 0 },
      { label: 'Invites sent', done: this.invitedCount > 0 },
      { label: 'Supplier quotes received', done: this.quoteCount > 0 },
      { label: 'Winner selected', done: this.winnerCount > 0 },
      { label: 'Purchase quote/order created', done: this.quoteCreated || this.orderCreated }
    ];
  }

  get rfqWorkbench(): RfqWorkbenchView {
    if (this.orderCreated) {
      return this.buildWorkbench('Purchase order created', 'RFQ processing is complete.', '', '', true);
    }

    if (this.quoteCreated) {
      return this.buildWorkbench('Purchase quote created', 'Purchase quote already exists for the selected supplier.', '', '', true);
    }

    if (!this.vendorCount) {
      return this.buildWorkbench('Build vendor list', 'Add vendor rows first.', 'Send Invite', 'sendInvite', true);
    }

    if (!this.invitedCount) {
      return this.buildWorkbench('Vendor list prepared', 'Invite vendors first.', 'Send Invite', 'sendInvite', false);
    }

    if (!this.quoteCount) {
      return this.buildWorkbench('Waiting for supplier quotes', 'Compare once supplier quotes arrive.', 'Compare Quote', 'CompareQuote', false);
    }

    if (!this.winnerCount) {
      return this.buildWorkbench('Compare received quotes', 'Review ranked supplier quotes and select one winner.', 'Compare Quote', 'CompareQuote', false);
    }

    return this.buildWorkbench('Winner selected', 'You can compare again at any time before final conversion.', 'Compare Quote', 'CompareQuote', false);
  }

  get recommendedVendor(): RfqVendorView | null {
    return this.vendorList.find((vendor) => vendor.recommended) ?? null;
  }

  get selectedVendorDisplay(): string {
    if (!this.compareSelected.length) {
      return 'None';
    }

    const selectedVendor = this.vendorList.find((vendor) => vendor.rowIndex === this.compareSelected[0]);
    return selectedVendor?.vendorName || selectedVendor?.vendorNo || 'None';
  }

  get compareInsight(): RfqCompareInsight {
    const recommendedVendor = this.recommendedVendor;

    if (!recommendedVendor) {
      return {
        recommendation: 'Recommendation appears after valid supplier quotes are captured.',
        bestPrice: '-',
        bestVendor: '-',
        delivery: '-'
      };
    }

    return {
      recommendation: `${recommendedVendor.vendorName || recommendedVendor.vendorNo} is currently the recommended vendor.`,
      bestPrice: this.formatAmount(recommendedVendor.quotedAmount),
      bestVendor: recommendedVendor.vendorName || recommendedVendor.vendorNo || '-',
      delivery: this.displayDelivery(recommendedVendor)
    };
  }

  runRfqWorkbenchAction(): void {
    if (!this.rfqWorkbench.actionName) {
      return;
    }

    this.action.emit(this.rfqWorkbench.actionName);
  }

  calculateVendorSummary(): void {
    const cfg = this.config;
    const sourceRows = (this.lineData || []).filter((row) => row?.[cfg.vendorNoProp] || row?.[cfg.vendorNameProp]);
    const quotedRows = sourceRows
      .map((row, rowIndex) => ({
        row,
        rowIndex,
        quotedAmount: Number(row?.[cfg.quotedAmountProp] ?? 0),
        deliveryDays: this.resolveDeliveryDays(row),
        quotationDate: row?.[cfg.quotationDateProp] ? new Date(row[cfg.quotationDateProp]) : new Date(9999, 11, 31)
      }))
      .filter((entry) => entry.quotedAmount > 0)
      .sort((a, b) => {
        if (a.quotedAmount !== b.quotedAmount) {
          return a.quotedAmount - b.quotedAmount;
        }

        if ((a.deliveryDays ?? Number.MAX_SAFE_INTEGER) !== (b.deliveryDays ?? Number.MAX_SAFE_INTEGER)) {
          return (a.deliveryDays ?? Number.MAX_SAFE_INTEGER) - (b.deliveryDays ?? Number.MAX_SAFE_INTEGER);
        }

        return a.quotationDate.getTime() - b.quotationDate.getTime();
      });

    const rankByRowIndex = new Map<number, number>();
    quotedRows.forEach((entry, index) => rankByRowIndex.set(entry.rowIndex, index + 1));

    this.vendorList = sourceRows.map((row, rowIndex) => {
      const quotedAmount = Number(row?.[cfg.quotedAmountProp] ?? 0);

      return {
        rowIndex,
        vendorNo: String(row?.[cfg.vendorNoProp] ?? '').trim(),
        vendorName: String(row?.[cfg.vendorNameProp] ?? '').trim(),
        quotedAmount,
        deliveryDate: row?.[cfg.deliveryDateProp],
        deliveryDays: this.resolveDeliveryDays(row),
        quotationDate: row?.[cfg.quotationDateProp] ? new Date(row[cfg.quotationDateProp]) : new Date(9999, 11, 31),
        isInvited: this.truthy(row?.[cfg.invitedProp]),
        isQuoted: quotedAmount > 0,
        isSelected: this.truthy(row?.[cfg.selectedProp]),
        quoteNo: String(row?.[cfg.quoteNoProp] ?? '').trim(),
        poNo: String(row?.[cfg.orderNoProp] ?? '').trim(),
        recommended: rankByRowIndex.get(rowIndex) === 1,
        rank: rankByRowIndex.get(rowIndex) ?? null
      };
    });

    const selectedVendor = this.vendorList.find((vendor) => vendor.isSelected);
    if (selectedVendor) {
      this.compareSelected = [selectedVendor.rowIndex];
      this.selectedItemService.setSelectedLines([selectedVendor.rowIndex]);
      return;
    }

    this.compareSelected = this.compareSelected.filter((rowIndex) => this.vendorList.some((vendor) => vendor.rowIndex === rowIndex));

    if (!this.compareSelected.length) {
      this.selectedItemService.clearSelectedLines();
    }
  }

  confirmVendorSelection(): void {
    if (!this.compareSelected.length) {
      this.selectRecommendedVendor();
    }

    if (!this.compareSelected.length) {
      return;
    }

    this.action.emit('selectWinner');
  }

  selectCompareVendor(index: number): void {
    const vendor = this.vendorList.find((candidate) => candidate.rowIndex === index);
    if (!vendor || !vendor.isQuoted || this.quoteCreated || this.orderCreated) {
      return;
    }

    this.compareSelected = [index];
    this.selectedItemService.setSelectedLines([index]);
  }

  selectRecommendedVendor(): void {
    if (this.recommendedVendor) {
      this.selectCompareVendor(this.recommendedVendor.rowIndex);
    }
  }

  closeCompareTab(): void {
    this.compareSelected = [];
    this.selectedItemService.clearSelectedLines();
  }

  isCompareRowSelected(index: number): boolean {
    return this.compareSelected.includes(index);
  }

  formatAmount(value: any): string {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) {
      return '-';
    }

    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  displayDelivery(vendor: RfqVendorView): string {
    if (vendor.deliveryDays !== null && Number.isFinite(vendor.deliveryDays)) {
      return `${vendor.deliveryDays} day(s)`;
    }

    if (!vendor.deliveryDate) {
      return '-';
    }

    const deliveryDate = new Date(vendor.deliveryDate);
    if (Number.isNaN(deliveryDate.getTime())) {
      return '-';
    }

    return deliveryDate.toLocaleDateString();
  }

  private get config() {
    return {
      vendorNoProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.vendorNoProp ?? 'vendorNo',
      vendorNameProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.vendorNameProp ?? 'vendorName',
      invitedProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.invitedProp ?? 'isInvited',
      quotedAmountProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.quotedAmountProp ?? 'quotedAmount',
      selectedProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.selectedProp ?? 'isSelected',
      quoteNoProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.quoteNoProp ?? 'quoteNo',
      orderNoProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.orderNoProp ?? 'poNo',
      deliveryDateProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.deliveryDateProp ?? 'deliveryDate',
      deliveryDaysProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.deliveryDaysProp ?? 'deliveryDays',
      quotationDateProp: this.itemConfig?.informationSectionConfig?.rfqWorkflow?.quotationDateProp ?? 'quotationDate'
    };
  }

  private get vendorCount(): number {
    return this.vendorList.length;
  }

  private get invitedCount(): number {
    return this.vendorList.filter((vendor) => vendor.isInvited).length;
  }

  private get quoteCount(): number {
    return this.vendorList.filter((vendor) => vendor.isQuoted).length;
  }

  private get winnerCount(): number {
    return this.vendorList.filter((vendor) => vendor.isSelected).length;
  }

  private get quoteCreated(): boolean {
    return this.vendorList.some((vendor) => !!vendor.quoteNo);
  }

  private get orderCreated(): boolean {
    return this.vendorList.some((vendor) => !!vendor.poNo);
  }

  private buildWorkbench(
    stage: string,
    guidance: string,
    actionLabel: string,
    actionName: RfqWorkbenchView['actionName'],
    disabled: boolean
  ): RfqWorkbenchView {
    return {
      stage,
      guidance,
      actionLabel,
      actionName,
      disabled,
      vendorCount: this.vendorCount,
      invitedCount: this.invitedCount,
      quoteCount: this.quoteCount,
      winnerCount: this.winnerCount
    };
  }

  private resolveDeliveryDays(row: any): number | null {
    const cfg = this.config;
    const directDays = Number(row?.[cfg.deliveryDaysProp]);
    if (Number.isFinite(directDays) && directDays >= 0) {
      return directDays;
    }

    if (!row?.[cfg.deliveryDateProp]) {
      return null;
    }

    const deliveryDate = new Date(row[cfg.deliveryDateProp]);
    if (Number.isNaN(deliveryDate.getTime())) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deliveryDate.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((deliveryDate.getTime() - today.getTime()) / 86400000));
  }

  private truthy(value: any): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
  }
}