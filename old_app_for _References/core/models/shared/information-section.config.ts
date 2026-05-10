import { InformationDetailSecctionType } from './information-section.enum';
import { SummaryFieldConfig } from '../../../shared/components/summary/summary.config';

export interface InformationSectionConfig {
  documentNoProp?: string;       // field on headerData that holds the document number (e.g. 'PreAssignedNo', 'claimNo')
  documentType?: string;         // BC DocumentType string (e.g. 'Invoice', 'Employee Claim', 'Claim Payment')
  documentStatusProp?: string;   // field on headerData that holds the status (e.g. 'Status', 'ApprovalStatus')

  /**
   * POSTED PAGE FLAG
   * -----------------
   * false → hides Add and Delete buttons for EVERYONE (including SuperAdmin).
   * Use this on any posted / finalized / audit page where nobody should upload or delete.
   *
   * Example:
   *   informationSectionConfig: {
   *     documentNoProp: 'PreAssignedNo',
   *     documentType: 'Invoice',
   *     allowAttachmentUpload: false,   ← posted page, locked forever
   *   }
   *
   * Omit this property (or set true) for normal editable pages.
   * Upload/delete will be controlled by role (SuperAdmin) and document status.
   */
  allowAttachmentUpload?: boolean;

  /**
   * When true, the top factbox "Documents" block resolves documentNo/documentType
   * from the currently selected line (cross-document scenarios like Claim Review/Payment).
   * Falls back to header documentNoProp/documentType when no line is selected.
   */
  useSelectedLineForHeaderAttachments?: boolean;

  informationDetailSecctionType?: InformationDetailSecctionType;

  /** Factbox summary (optional, config-driven) */
  summaryFields?: SummaryFieldConfig[];
  SummaryFieldConfigLine?: SummaryFieldConfig[],

  procurementFlow?: {
    enabled?: boolean;
    documentNoProp?: string;
    methodProp?: string;
    procurementStatusProp?: string;
    sourcingStatusProp?: string;
    workflowStatusProp?: string;
    selectedVendorNoProp?: string;
    selectedVendorNameProp?: string;
    vendorNoProp?: string;
    vendorNameProp?: string;
    quoteCreatedProp?: string;
    orderCreatedProp?: string;
    purchaseOrderNoProp?: string;
    vendorLinesApi?: string;
    vendorLineDocumentNoProp?: string;
    vendorLineInvitedProp?: string;
    vendorLineQuotedAmountProp?: string;
    vendorLineSelectedProp?: string;
    vendorLineQuoteNoProp?: string;
    vendorLineOrderNoProp?: string;
  };

  rfqWorkflow?: {
    enabled?: boolean;
    vendorNoProp?: string;
    vendorNameProp?: string;
    invitedProp?: string;
    quotedAmountProp?: string;
    selectedProp?: string;
    quoteNoProp?: string;
    orderNoProp?: string;
    deliveryDateProp?: string;
    deliveryDaysProp?: string;
    quotationDateProp?: string;
  };

}
