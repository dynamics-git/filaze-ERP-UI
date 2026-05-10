// import { FormFieldType } from "../../../core/models/shared/formField.enum";
// import { InformationDetailSecctionType } from "../../../core/models/shared/information-section.enum";
// import { ListTableConfig } from "../../../core/models/shared/list-table.config";
// import { ClaimPaymentHeader, ClaimPaymentLine, ClaimPaymentCalculation } from "../../claim/claim-payments/claim-payments.config";
// import { EmployeeClaimHeader, EmployeeClaimLime, EmployeeClaimCalculation } from "../../claim/employee-claim/employee-claim.config";
// import { ClaimJournalHeader, ClaimJournalLine } from "../../Journal/journal-claim/journal-claim.config";
// import { PRBidWaiverHeader, PRBidWaiverLine, PRBidWaiverCalculation } from "../../Purchase/pr-bid-waiver/PR-Bid-Waiver.config";
// import { PurchaseInvoiceHeader, PurchaseInvoiceLine, PurchaseInvoiceCalculation } from "../../Purchase/purchase-invoice/purchase-invoice.config";
// import { PurchaseOrderHeader, PurchaseOrderLine, PurchaseOrderCalculation } from "../../Purchase/purchase-order/purchase-order.config";
// import { PurchaseQuoteHeader, PurchaseQuoteLine } from "../../Purchase/purchase-quote/purchase-quote.config";
// import { PurchaseRequisitionHeader, PurchaseRequisitionLine, PurchaseRequisitionCalculation } from "../../Purchase/purchase-requisition/purchase-requisition.config";
// import { SalesInvoiveHeader, SalesInvoiceLine, SalesInvoicecalculation } from "../../sales/sales-invoice/sales-invoice.config";
// import { BudgetRequestHeadedr, BudgetRequestLine } from "../budget-request/budget-request.config";

// export function createApprovedEntryConfig(userId: string): ListTableConfig {
//     return {
//         title: 'Approved Entries',
//         description: 'Manages Approved Entries',
//         pageName: 'APPROVED ENTRIES',
//         idProp: 'id',
//         api: '/approvalEntries',
//         showSaveButton: false,
//         showCancelButton: false,
//         showCreate: false,
//         showDelete: false,
//         headers: [{ prop: 'entryNo', name: 'Entry No' },
//         // { prop: 'documentNo', name: 'Document No.', isPrimaryLink: true },
//         { prop: 'documentType', name: 'Document Type' },
//         { prop: 'documentNo', name: 'Document No' },
//         // {
//         //   name: 'Document No',
//         //   prop: 'documentNo',
//         //   isPrimaryLink: true,
//         //   linkItemConfigs: [
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Requisition',
//         //       itemProp: 'Number',
//         //       linkItemType: 'Requisition',
//         //       itemConfig: {
//         //         title: 'Purchase Requisition',
//         //         recordId: "Number",
//         //         recordTitle: "Number",
//         //         headerConfig: PurchaseRequisitionHeader,
//         //         lineConfig: PurchaseRequisitionLine,
//         //         calculationSectionConfig: PurchaseRequisitionCalculation,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'Number',
//         //           documentType: 'Requisition',
//         //           documentStatusProp: 'ApprovalStatus',
//         //           informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Budget',
//         //       itemProp: 'No',
//         //       linkItemType: 'Budget',
//         //       itemConfig: {
//         //         title: 'Budget Request',
//         //         recordId: "No",
//         //         recordTitle: "No",
//         //         headerConfig: BudgetRequestHeadedr,
//         //         lineConfig: BudgetRequestLine,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'No',
//         //           documentType: 'Budget',
//         //           documentStatusProp: 'Status',
//         //           informationDetailSecctionType: InformationDetailSecctionType.JournalClaim
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Sales Invoice',
//         //       itemProp: 'Number',
//         //       linkItemType: 'Sales Invoice',
//         //       itemConfig: {
//         //         title: 'Sales Invoice',
//         //         recordId: "Number",
//         //         recordTitle: "Number",
//         //         headerConfig: SalesInvoiveHeader,
//         //         lineConfig: SalesInvoiceLine,
//         //         calculationSectionConfig: SalesInvoicecalculation,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'Number',
//         //           documentType: 'Sales Invoice',
//         //           documentStatusProp: 'Status',
//         //           informationDetailSecctionType: InformationDetailSecctionType.SalesInvoice
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Petty Cash',
//         //       itemProp: 'DocumentNo',
//         //       linkItemType: 'Petty Cash',
//         //       itemConfig: {
//         //         title: 'Petty Cash',
//         //         recordId: "DocumentNo",
//         //         recordTitle: "DocumentNo",
//         //         headerConfig: ClaimJournalHeader,
//         //         lineConfig: ClaimJournalLine,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'DocumentNo',
//         //           documentType: 'Petty Cash',
//         //           documentStatusProp: 'Status',
//         //           informationDetailSecctionType: InformationDetailSecctionType.JournalClaim
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'BW Requisition',
//         //       itemProp: 'Number',
//         //       linkItemType: 'BW Requisition',
//         //       itemConfig: {
//         //         title: 'PR Bid Waiver',
//         //         recordId: "Number",
//         //         recordTitle: "Number",
//         //         headerConfig: PRBidWaiverHeader,
//         //         lineConfig: PRBidWaiverLine,
//         //         calculationSectionConfig: PRBidWaiverCalculation,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'Number',
//         //           documentType: 'BW Requisition',
//         //           documentStatusProp: 'ApprovalStatus',
//         //           informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Invoice',
//         //       itemProp: 'Number',
//         //       linkItemType: 'Invoice',
//         //       itemConfig: {
//         //         title: 'Purchase Invoice',
//         //         recordId: "Number",
//         //         recordTitle: "Number",
//         //         headerConfig: PurchaseInvoiceHeader,
//         //         lineConfig: PurchaseInvoiceLine,
//         //         calculationSectionConfig: PurchaseInvoiceCalculation,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'Number',
//         //           documentType: 'Invoice',
//         //           documentStatusProp: 'Status',
//         //           informationDetailSecctionType: InformationDetailSecctionType.PurchaseInvoice
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Quote',
//         //       itemProp: 'Number',
//         //       linkItemType: 'Quote',
//         //       itemConfig: {
//         //         title: 'Purchase Quote',
//         //         recordId: "Number",
//         //         recordTitle: "Number",
//         //         headerConfig: PurchaseQuoteHeader,
//         //         lineConfig: PurchaseQuoteLine,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'Number',
//         //           documentType: 'Quote',
//         //           documentStatusProp: 'Status',
//         //           informationDetailSecctionType: InformationDetailSecctionType.PurchaseQuote
//         //         },
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Order',
//         //       itemProp: 'Number',
//         //       linkItemType: 'Order',
//         //       itemConfig: {
//         //         title: 'Purchase Order',
//         //         recordId: "Number",
//         //         recordTitle: "Number",
//         //         headerConfig: PurchaseOrderHeader,
//         //         lineConfig: PurchaseOrderLine,
//         //         calculationSectionConfig: PurchaseOrderCalculation,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'Number',
//         //           documentType: 'Order',
//         //           documentStatusProp: 'Status',
//         //           informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrder
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Employee Claim',
//         //       itemProp: 'claimNo',
//         //       linkItemType: 'Employee Claim',
//         //       itemConfig: {
//         //         title: 'Employee Claim',
//         //         recordId: "claimNo",
//         //         recordTitle: "claimNo",
//         //         headerConfig: EmployeeClaimHeader,
//         //         lineConfig: EmployeeClaimLime,
//         //         calculationSectionConfig: EmployeeClaimCalculation,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'claimNo',
//         //           documentType: 'Employee Claim',
//         //           documentStatusProp: 'EmployeeClaim',
//         //           informationDetailSecctionType: InformationDetailSecctionType.EmployeeClaim
//         //         }
//         //       }
//         //     },
//         //     {
//         //       property: 'DocumentType',
//         //       value: 'Claim Payment',
//         //       itemProp: 'batchNo',
//         //       linkItemType: 'Claim Payment',
//         //       itemConfig: {
//         //         title: 'Claim Payment',
//         //         recordId: "claimNo",
//         //         recordTitle: "claimNo",
//         //         headerConfig: ClaimPaymentHeader,
//         //         lineConfig: ClaimPaymentLine,
//         //         calculationSectionConfig: ClaimPaymentCalculation,
//         //         informationSectionConfig: {
//         //           documentNoProp: 'batchNo',
//         //           documentType: 'Claim Payment',
//         //           documentStatusProp: 'ClaimPayment',
//         //         }
//         //       }
//         //     }
//         //   ]
//         // },
//         { prop: 'sequenceNo', name: 'Sequence No' },
//         { prop: 'senderId', name: 'Sender ID' },
//         { prop: 'approverId', name: 'Approve ID' },
//         { prop: 'status', name: 'Status' },
//         { prop: 'dateTimeSentForApproval', name: 'Send Date', isDate: true },
//         { prop: 'lastDateTimeModified', name: 'Action Date', isDate: true },
//         { prop: 'amount', name: 'Amount' },
//         { prop: 'limitType', name: 'Limit Type' },
//         { prop: 'delegateTo', name: 'Delegate' },
//         { prop: 'submissionNo', name: 'Submission No' },
//         { prop: 'actionComment', name: 'Comment' },
//         ],
//         filters: [
//             {
//                 field: '(Status',
//                 operator: 'eq',
//                 value: "'Approved' or Status eq 'Rejected')"
//             },
//             {
//                 field: 'ApproverID',
//                 operator: 'eq',
//                 value: `'${userId}'`
//             },
//             {
//                 field: '(documentType',
//                 operator: 'eq',
//                 value: `'Invoice' or documentType eq 'Employee Claim')`
//             },
//         ],
//         controls: [
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'entryNo',
//                 name: 'Entry No',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'documentType',
//                 name: 'Document Type',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'documentNo',
//                 name: 'Document No',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'sequenceNo',
//                 name: 'Sequence No',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'senderId',
//                 name: 'Sender ID',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'approverId',
//                 name: 'Approver ID',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'status',
//                 name: 'Status',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.DateTime,
//                 label: 'dateTimeSentForApproval',
//                 name: 'Date-Time Sent',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.DateTime,
//                 label: 'lastDateTimeModified',
//                 name: 'Action Date',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'actionComment',
//                 name: 'Comment',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.Number,
//                 label: 'amount',
//                 name: 'Amount',
//                 decimal: true,
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'limitType',
//                 name: 'Limit Type',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'delegateTo',
//                 name: 'Delegate',
//                 readonly: true
//             },
//             {
//                 type: FormFieldType.TextBox,
//                 label: 'submissionNo',
//                 name: 'Submission No',
//                 readonly: true
//             }
//         ],
//         removeUnicodeCharFields: ['documentType', 'limitType']
//     }
// }

import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { InformationDetailSecctionType } from "../../../core/models/shared/information-section.enum";
import { ListTableConfig } from "../../../core/models/shared/list-table.config";
import { ClaimPaymentCalculation, ClaimPaymentHeader, ClaimPaymentLine } from "../../claim/claim-payments/claim-payments.config";
import { EmployeeClaimCalculation, EmployeeClaimHeader, EmployeeClaimLime } from "../../claim/employee-claim/employee-claim.config";
import { ClaimJournalHeader, ClaimJournalLine } from "../../Journal/journal-claim/journal-claim.config";
import { PRBidWaiverHeader, PRBidWaiverLine, PRBidWaiverCalculation } from "../../Purchase/pr-bid-waiver/PR-Bid-Waiver.config";
import { PurchaseInvoiceHeader, PurchaseInvoiceLine, PurchaseInvoiceCalculation } from "../../Purchase/purchase-invoice/purchase-invoice.config";
import { PurchaseOrderHeader, PurchaseOrderLine, PurchaseOrderCalculation } from "../../Purchase/purchase-order/purchase-order.config";
import { PurchaseQuoteHeader, PurchaseQuoteLine } from "../../Purchase/purchase-quote/purchase-quote.config";
import { PurchaseRequisitionHeader, PurchaseRequisitionLine, PurchaseRequisitionCalculation } from "../../Purchase/purchase-requisition/purchase-requisition.config";
import { SalesInvoiveHeader, SalesInvoiceLine, SalesInvoicecalculation } from "../../sales/sales-invoice/sales-invoice.config";
import { BudgetRequestHeadedr, BudgetRequestLine } from "../budget-request/budget-request.config";

export const ApprovedEntryHeader: HeaderDataConfig = {
  idProp: 'Id',
  api: '/approvalEntries',
  title: 'Approval Entries',
  sections: [
    {
      title: 'General Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'documentType',
            name: 'Document Type',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'documentNo',
            name: 'Document No',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'approvalType',
            name: 'Approval Type',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'status',
            name: 'Status',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'approverId',
            name: 'Approver',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'senderId',
            name: 'Sender',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'dateTimeSentForApproval',
            name: 'Sent For Approval',
            readonly: true
          },
          {
            type: FormFieldType.DateTime,
            label: 'lastDateTimeModified',
            name: 'Last Modified',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.Number,
            label: 'amount',
            name: 'Amount',
            readonly: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'currencyCode',
            name: 'Currency',
            readonly: true
          }
        ]
      ]
    }
  ],

  removeUnicodeCharFields: [
    'documentType',
    'limitType',
    'approvalType'
  ]
};

ApprovedEntryHeader.controls = (ApprovedEntryHeader.sections ?? []).flatMap(section => section.controls);



