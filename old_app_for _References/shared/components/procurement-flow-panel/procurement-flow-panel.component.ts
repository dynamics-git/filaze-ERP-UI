import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RestService } from '../../../core/services/rest.service';
import { ProcurementFlowAction } from '../../../features/Purchase/models/procurement-flow.model';

type ProcurementFlowTone = 'success' | 'active' | 'warning' | 'neutral';

interface ProcurementFlowCheck {
  label: string;
  done: boolean;
}

interface ProcurementFlowView {
  title: string;
  stage: string;
  nextStep: string;
  actionLabel: string;
  actionName: ProcurementFlowAction | '';
  disabled: boolean;
  checks: ProcurementFlowCheck[];
  vendorCount: number;
  invitedCount: number;
  quoteCount: number;
  winnerCount: number;
  procurementStatus: string;
  sourcingStatus: string;
  workflowStatus: string;
  method: string;
  tone: ProcurementFlowTone;
  statusLabel: string;
  caption: string;
  actionIcon: string;
}

@Component({
  standalone: false,
  selector: 'app-procurement-flow-panel',
  templateUrl: './procurement-flow-panel.component.html',
  styleUrls: ['./procurement-flow-panel.component.scss']
})
export class ProcurementFlowPanelComponent implements OnChanges {
  @Input() headerData: any;
  @Input() itemConfig: any;
  @Input() lineData: any[] = [];
  @Input() documentNo: string | null = null;
  @Output() action = new EventEmitter<string>();

  vendorLines: any[] = [];
  loading = false;

  constructor(private restService: RestService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['headerData'] || changes['itemConfig'] || changes['documentNo']) {
      this.loadVendorLines();
    }
  }

  get enabled(): boolean {
    return this.config?.enabled === true;
  }

  get state(): ProcurementFlowView {
    const cfg = this.config;
    const header = this.headerData ?? {};
    const method = String(header[cfg.methodProp ?? 'procurementMethod'] ?? '').trim();
    const procurementStatus = String(header[cfg.procurementStatusProp ?? 'procurementStatus'] ?? '').trim();
    const sourcingStatus = String(header[cfg.sourcingStatusProp ?? 'sourcingStatus'] ?? '').trim();
    const workflowStatus = String(header[cfg.workflowStatusProp ?? 'workflowStatus'] ?? '').trim();
    const reviewStarted = !!procurementStatus && !['open', 'draft'].includes(procurementStatus.toLowerCase());
    const vendorSelected = !!(
      header[cfg.selectedVendorNoProp ?? 'selectedVendorNo']
      || header[cfg.selectedVendorNameProp ?? 'selectedVendorName']
      || header[cfg.vendorNoProp ?? 'vendorNo']
      || header[cfg.vendorNameProp ?? 'vendorName']
    );
    const quoteCreated = this.truthy(header[cfg.quoteCreatedProp ?? 'quoteCreated']);
    const orderCreated = this.truthy(header[cfg.orderCreatedProp ?? 'orderCreated'])
      || !!header[cfg.purchaseOrderNoProp ?? 'purchaseOrderNo'];

    const vendorCount = this.vendorLines.filter(row => row?.vendorNo || row?.vendorName).length;
    const invitedCount = this.vendorLines.filter(row => this.truthy(row?.[cfg.vendorLineInvitedProp ?? 'isInvited'])).length;
    const quoteCount = this.vendorLines.filter(row => Number(row?.[cfg.vendorLineQuotedAmountProp ?? 'quotedAmount'] ?? 0) > 0).length;
    const winnerCount = this.vendorLines.filter(row => this.truthy(row?.[cfg.vendorLineSelectedProp ?? 'isSelected'])).length;
    const rfqQuoteCreated = this.vendorLines.some(row => !!row?.[cfg.vendorLineQuoteNoProp ?? 'quoteNo'] || this.truthy(row?.quoteCreated));
    const rfqOrderCreated = this.vendorLines.some(row => !!row?.[cfg.vendorLineOrderNoProp ?? 'poNo'] || this.truthy(row?.poCreated));

    const meta = { vendorCount, invitedCount, quoteCount, winnerCount, procurementStatus, sourcingStatus, workflowStatus };
    const headerHasVendor = !!(header[cfg.vendorNoProp ?? 'vendorNo'] || header[cfg.vendorNameProp ?? 'vendorName']);
    const headerHasSelectedVendor = !!(header[cfg.selectedVendorNoProp ?? 'selectedVendorNo'] || header[cfg.selectedVendorNameProp ?? 'selectedVendorName']);
    const hasVendorContext = vendorSelected || headerHasVendor || headerHasSelectedVendor;
    const hasWaiverReason = !!String(header.Reason ?? '').trim();
    const hasJustification = !!String(header.Remark ?? '').trim();
    const hasLines = this.hasPrLines();

    if (orderCreated || rfqOrderCreated) {
      return this.build('Order Created', method || 'Completed', 'Purchase order already exists.', 'Completed', '', true, [
        this.check('Procurement review started', true),
        this.check('Procurement method selected', !!method),
        this.check('Order created', true)
      ], meta);
    }

    if (quoteCreated || rfqQuoteCreated) {
      return this.build('Quote Created', method || 'Completed', 'Purchase quote already exists.', 'Completed', '', true, [
        this.check('Procurement review started', true),
        this.check('Procurement method selected', !!method),
        this.check('Quote created', true)
      ], meta);
    }

    if (!reviewStarted) {
      return this.build('Start Procurement Review', 'Not Started', 'Review the requisition and start sourcing from the details panel.', 'Start Procurement Review', 'StartProcurementReview', !hasLines, [
        this.check('PR lines available', hasLines),
        this.check('Justification entered', hasJustification),
        this.check('Ready for sourcing', hasLines)
      ], meta);
    }

    if (!method) {
      return this.build('Set Procurement Method', procurementStatus || 'Review Started', 'Choose Direct Purchase, RFQ, Bid Waiver, or Vendor Selection.', 'Set Procurement Method', 'SetProcurementMethod', false, [
        this.check('Procurement review started', true),
        this.check('Procurement method selected', false)
      ], meta);
    }

    if (method === 'RFQ') {
      let title = 'Open RFQ Workbench';
      let nextStep = 'Add vendors, send invite, capture quotes, compare, then select winner.';
      let actionLabel = 'Open RFQ Workbench';

      if (vendorCount > 0 && invitedCount === 0) {
        title = 'Send RFQ Invite';
        nextStep = 'Open the RFQ workbench and send invite to selected vendors.';
      } else if (invitedCount > 0 && quoteCount === 0) {
        title = 'Capture Supplier Quotes';
        nextStep = 'Enter quoted amount and delivery date from supplier responses.';
      } else if (quoteCount > 0 && winnerCount === 0) {
        title = 'Compare And Select Winner';
        nextStep = 'Compare received quotes and select one winning vendor.';
      } else if (winnerCount > 0) {
        title = 'Convert Winner To Quote';
        nextStep = 'Convert the selected winning vendor to a purchase quote.';
        actionLabel = 'Convert Winner To Quote';
      }

      return this.build(title, method, nextStep, actionLabel, 'InviteVendors', false, [
        this.check('Vendor list prepared', vendorCount > 0),
        this.check('Vendor invite sent', invitedCount > 0),
        this.check('Supplier quotes received', quoteCount > 0),
        this.check('Winning vendor selected', winnerCount > 0),
        this.check('Purchase quote created', quoteCreated || rfqQuoteCreated)
      ], meta);
    }

    if (method === 'Direct Purchase' || method === 'Contract Purchase') {
      return this.build(vendorSelected ? 'Create Purchase Order' : 'Select Vendor', method, vendorSelected ? 'Vendor is selected. Convert the requisition to an order.' : 'Choose a vendor in the form, then mark it as selected here.', vendorSelected ? 'Convert To Order' : 'Mark Vendor Selected', vendorSelected ? 'ConvertPurchaseRequisitionToOrder' : 'MarkVendorSelected', !hasVendorContext, [
        this.check('Procurement review started', true),
        this.check('Procurement method selected', true),
        this.check('Vendor chosen on header', hasVendorContext),
        this.check('Vendor selected', vendorSelected),
        this.check('Order created', false)
      ], meta);
    }

    const bidWaiver = method === 'Bid Waiver';
    const readyForDecision = bidWaiver ? (hasVendorContext && hasWaiverReason && hasJustification) : hasVendorContext;

    return this.build(vendorSelected ? 'Create Purchase Quote' : 'Complete Vendor Decision', method, vendorSelected ? 'Vendor decision is ready. Convert the requisition to quote.' : 'Complete the vendor decision in the form before quote creation.', vendorSelected ? 'Convert To Quote' : 'Mark Vendor Selected', vendorSelected ? 'ConvertPurchaseRequisitionToQuote' : 'MarkVendorSelected', !readyForDecision, [
      this.check('Procurement review started', true),
      this.check('Procurement method selected', true),
      this.check('Vendor chosen on header', hasVendorContext),
      this.check('Waiver reason entered', !bidWaiver || hasWaiverReason),
      this.check('Justification entered', !bidWaiver || hasJustification),
      this.check('Vendor selected', vendorSelected),
      this.check('Quote created', false)
    ], meta);
  }

  runAction(): void {
    if (this.state?.actionName) {
      this.action.emit(this.state.actionName);
    }
  }

  private get config(): any {
    return this.itemConfig?.informationSectionConfig?.procurementFlow ?? {};
  }

  private async loadVendorLines(): Promise<void> {
    const cfg = this.config;
    if (!cfg?.enabled || !cfg.vendorLinesApi || !cfg.vendorLineDocumentNoProp) {
      this.vendorLines = [];
      return;
    }

    const docNo = this.headerData?.[cfg.documentNoProp ?? this.itemConfig?.informationSectionConfig?.documentNoProp ?? 'Number'] ?? this.documentNo;
    if (!docNo) {
      this.vendorLines = [];
      return;
    }

    this.loading = true;
    try {
      const response: any = await firstValueFrom(this.restService.get(`${cfg.vendorLinesApi}?$filter=${cfg.vendorLineDocumentNoProp} eq '${docNo}'`));
      this.vendorLines = response?.value ?? [];
    } catch {
      this.vendorLines = [];
    } finally {
      this.loading = false;
    }
  }

  private hasPrLines(): boolean {
    return Array.isArray(this.lineData) && this.lineData.some(row => row?.Number || row?.Description);
  }

  private build(title: string, stage: string, nextStep: string, actionLabel: string, actionName: ProcurementFlowAction | '', disabled: boolean, checks: ProcurementFlowCheck[], meta: any): ProcurementFlowView {
    const statusParts = [meta.procurementStatus, meta.sourcingStatus, meta.workflowStatus]
      .map((value: string) => String(value ?? '').trim())
      .filter((value: string) => !!value);

    return {
      title,
      stage,
      nextStep,
      actionLabel,
      actionName,
      disabled,
      checks,
      ...meta,
      method: stage,
      tone: this.resolveTone(actionName, disabled, title),
      statusLabel: statusParts[0] || 'Pending update',
      caption: this.documentNo ? `PR ${this.documentNo}` : 'Procurement progress',
      actionIcon: this.resolveActionIcon(actionName)
    };
  }

  private check(label: string, done: boolean): ProcurementFlowCheck {
    return { label, done };
  }

  private resolveTone(actionName: ProcurementFlowAction | '', disabled: boolean, title: string): ProcurementFlowTone {
    if (!actionName || title === 'Order Created' || title === 'Quote Created') {
      return 'success';
    }

    if (disabled) {
      return 'warning';
    }

    if (actionName === 'StartProcurementReview' || actionName === 'SetProcurementMethod') {
      return 'neutral';
    }

    return 'active';
  }

  private resolveActionIcon(actionName: ProcurementFlowAction | ''): string {
    switch (actionName) {
      case 'StartProcurementReview':
        return 'bi-play-circle';
      case 'SetProcurementMethod':
        return 'bi-sliders';
      case 'InviteVendors':
        return 'bi-send';
      case 'MarkVendorSelected':
        return 'bi-person-check';
      case 'ConvertPurchaseRequisitionToQuote':
        return 'bi-file-earmark-text';
      case 'ConvertPurchaseRequisitionToOrder':
        return 'bi-box-arrow-right';
      default:
        return 'bi-check-circle';
    }
  }

  private truthy(value: any): boolean {
    return value === true || String(value ?? '').trim().toLowerCase() === 'true';
  }
}
