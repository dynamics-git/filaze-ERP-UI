export type ProcurementMethod =
  | 'Direct Purchase'
  | 'RFQ'
  | 'Bid Waiver'
  | 'Vendor Selection'
  | 'Contract Purchase'
  | '';

export type ProcurementFlowAction =
  | 'StartProcurementReview'
  | 'SetProcurementMethod'
  | 'InviteVendors'
  | 'MarkVendorSelected'
  | 'ConvertPurchaseRequisitionToQuote'
  | 'ConvertPurchaseRequisitionToOrder';

export interface ProcurementFlowButtonState {
  label: string;
  isVisible: boolean;
  isEnable: boolean;
  reason?: string;
}

export interface ProcurementFlowState {
  method: ProcurementMethod;
  stage: string;
  nextAction: ProcurementFlowAction;
  requirements: string[];
  buttons: ProcurementFlowButtonState[];
}
