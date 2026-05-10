import { Injectable } from '@angular/core';
import { ProcurementFlowState, ProcurementMethod } from '../models/procurement-flow.model';

@Injectable()
export class ProcurementFlowService {
  getState(header: any, lines: any[] = []): ProcurementFlowState {
    const method = this.method(header?.procurementMethod);
    const reviewStarted = this.reviewStarted(header);
    const hasVendor = this.hasVendor(header);
    const bidWaiverComplete = this.bidWaiverComplete(header);
    const orderCreated = this.truthy(header?.orderCreated) || !!header?.purchaseOrderNo || this.text(header?.poCreationStatus) === 'po created';
    const quoteCreated = this.truthy(header?.quoteCreated);

    if (orderCreated) {
      return this.state(method, 'Order Created', 'ConvertPurchaseRequisitionToOrder', ['Purchase order already exists']);
    }

    if (quoteCreated) {
      return this.state(method, 'Quote Created', 'ConvertPurchaseRequisitionToQuote', ['Purchase quote already exists']);
    }

    if (!reviewStarted) {
      return this.state('', 'Ready for Procurement Review', 'StartProcurementReview', [
        lines.length ? 'PR lines are available' : 'Add at least one PR line',
        header?.Remark ? 'Justification is available' : 'Enter justification / remark'
      ]);
    }

    if (!method) {
      return this.state('', 'Choose Procurement Method', 'SetProcurementMethod', [
        'Choose Direct Purchase, RFQ, Bid Waiver, or Vendor Selection'
      ]);
    }

    switch (method) {
      case 'Direct Purchase':
        return this.state(method, hasVendor ? 'Vendor Ready' : 'Select Vendor', hasVendor ? 'ConvertPurchaseRequisitionToOrder' : 'MarkVendorSelected', [
          hasVendor ? 'Vendor selected' : 'Select Vendor No',
          'Direct Purchase converts to order'
        ]);
      case 'RFQ':
        return this.state(method, 'RFQ Sourcing', 'InviteVendors', [
          'Open Invite Vendors',
          'Send RFQ',
          'Capture quoted prices and delivery dates',
          'Compare and select winner',
          'Convert selected vendor to quote'
        ]);
      case 'Bid Waiver':
        return this.state(method, bidWaiverComplete ? 'Bid Waiver Ready' : 'Complete Bid Waiver', bidWaiverComplete ? 'ConvertPurchaseRequisitionToOrder' : 'MarkVendorSelected', [
          header?.Reason ? 'Waiver reason selected' : 'Select waiver reason',
          header?.Remark ? 'Justification entered' : 'Enter justification / remark',
          hasVendor ? 'Vendor selected' : 'Select Vendor No'
        ]);
      case 'Vendor Selection':
        return this.state(method, hasVendor ? 'Vendor Decision Ready' : 'Select Vendor', hasVendor ? 'ConvertPurchaseRequisitionToQuote' : 'MarkVendorSelected', [
          hasVendor ? 'Vendor selected' : 'Select Vendor No',
          'Vendor Selection converts to quote'
        ]);
      case 'Contract Purchase':
        return this.state(method, hasVendor ? 'Contract Vendor Ready' : 'Select Contract Vendor', hasVendor ? 'ConvertPurchaseRequisitionToOrder' : 'MarkVendorSelected', [
          hasVendor ? 'Vendor selected' : 'Select contract vendor'
        ]);
      default:
        return this.state('', 'Choose Procurement Method', 'SetProcurementMethod', ['Choose procurement method']);
    }
  }

  private state(method: ProcurementMethod, stage: string, nextAction: ProcurementFlowState['nextAction'], requirements: string[]): ProcurementFlowState {
    const labels = [
      'StartProcurementReview',
      'SetProcurementMethod',
      'MarkVendorSelected',
      'ConvertPurchaseRequisitionToQuote',
      'ConvertPurchaseRequisitionToOrder'
    ];

    return {
      method,
      stage,
      nextAction,
      requirements,
      buttons: labels.map(label => ({
        name: label,
        label,
        isVisible: label !== nextAction,
        isEnable: label === nextAction
      }))
    };
  }

  private reviewStarted(header: any): boolean {
    const status = this.text(header?.procurementStatus);
    return !!status && status !== 'open' && status !== 'draft';
  }

  private bidWaiverComplete(header: any): boolean {
    return !!(header?.Reason && header?.Remark && this.hasVendor(header));
  }

  private hasVendor(header: any): boolean {
    return !!(header?.selectedVendorNo || header?.vendorNo || header?.selectedVendorName || header?.vendorName);
  }

  private method(value: any): ProcurementMethod {
    const text = String(value ?? '').trim();
    return (['Direct Purchase', 'RFQ', 'Bid Waiver', 'Vendor Selection', 'Contract Purchase'].includes(text) ? text : '') as ProcurementMethod;
  }

  private text(value: any): string {
    return String(value ?? '').trim().toLowerCase();
  }

  private truthy(value: any): boolean {
    return value === true || this.text(value) === 'true';
  }
}
