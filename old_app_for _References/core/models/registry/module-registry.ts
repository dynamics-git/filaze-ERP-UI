import { BudgetRequestHeadedr, BudgetRequestLine } from "../../../features/ApprovalSetup/budget-request/budget-request.config";
import { ClaimPaymentHeader, ClaimPaymentLine, ClaimPaymentCalculation } from "../../../features/claim/claim-payments/claim-payments.config";
import { EmployeeClaimComponent } from "../../../features/claim/employee-claim/employee-claim.component";
import { EmployeeClaimCalculation, EmployeeClaimHeader, EmployeeClaimLime, } from "../../../features/claim/employee-claim/employee-claim.config";
import { rejectLineConfig } from "../../../features/claim/employee-claim/reject-line.config";
import { ClaimJournalHeader, ClaimJournalLine } from "../../../features/Journal/journal-claim/journal-claim.config";
import { ChangeAllocationsComponent } from "../../../features/Purchase/change-allocations/change-allocations.component";
import { ChangeAllocationHeader, ChangeAllocationLine } from "../../../features/Purchase/change-allocations/change-allocations.config";
import { PRBidWaiverHeader, PRBidWaiverLine, PRBidWaiverCalculation } from "../../../features/Purchase/pr-bid-waiver/PR-Bid-Waiver.config";
import { PurchaseInvoiceComponent } from "../../../features/Purchase/purchase-invoice/purchase-invoice.component";
import { PurchaseInvoiceCalculation, PurchaseInvoiceHeader, PurchaseInvoiceLine } from "../../../features/Purchase/purchase-invoice/purchase-invoice.config";
import { PurchaseOrderComponent } from "../../../features/Purchase/purchase-order/purchase-order.component";
import { PurchaseOrderHeader, PurchaseOrderLine, PurchaseOrderCalculation } from "../../../features/Purchase/purchase-order/purchase-order.config";
import { PurchaseQuoteHeader, PurchaseQuoteLine } from "../../../features/Purchase/purchase-quote/purchase-quote.config";
import { PurchaseRequisitionComponent } from "../../../features/Purchase/purchase-requisition/purchase-requisition.component";
import { PurchaseRequisitionHeader, PurchaseRequisitionLine, PurchaseRequisitionCalculation, RfqVendorItemConfig, PurchaseRequisitionListHeaders } from "../../../features/Purchase/purchase-requisition/purchase-requisition.config";
import { PrepaymentComponent } from "../../../features/Purchase/pre-payment/pre-payment.component";
import { RedistributePrePaymentHeader, RedistributePrePaymentLine } from "../../../features/Purchase/pre-payment/pre-payment.config";
import { SalesInvoiveHeader, SalesInvoiceLine, SalesInvoicecalculation } from "../../../features/sales/sales-invoice/sales-invoice.config";
import { SalesOrderHeader, SalesOrderLine, SalesOrderCalculation } from "../../../features/sales/sales-order/sales-order.config";
import { ButtonPermissionComponent } from "../../../features/UserManagement/button-permission/button-permission.component";
import { ButtonPermissionLine } from "../../../features/UserManagement/button-permission/button-permission.config";
import { InformationDetailSecctionType } from "../shared/information-section.enum";
import { ApprovalEntryComponent } from "../../../features/ApprovalSetup/approval-entry/approval-entry.component";
import { ApprovalEntryHeader } from "../../../features/ApprovalSetup/approval-entry/approval-entry.config";
import { ClaimRuleSetupComponent } from "../../../features/claim/claim-rule-setup/claim-rule-setup.component";
import { ClaimRuleConfig } from "../../../features/claim/claim-rule-setup/claim-rule-setup.config";
import { DimensionRulesLines } from "../../../shared/components/add-dimension/dimension-rules/dimension-rules.config";
import { CombinedRequisitionComponent } from "../../../features/Purchase/combined-requisition/combined-requisition.component";
import { CombinedRequisitionHeader, CombinedRequisitionLine, CombinedRequisitionCalculation } from "../../../features/Purchase/combined-requisition/combined-requisition.config";

export const ModuleRegistry: { [key: string]: any } = {

  linkItemRegistry: {
    'Requisition': {
      itemProp: 'Number',
      linkItemType: 'Requisition',
      itemConfig: {
        title: 'Purchase Requisition',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: PurchaseRequisitionHeader,
        lineConfig: PurchaseRequisitionLine,
        calculationSectionConfig: PurchaseRequisitionCalculation,
        informationSectionConfig: {
          documentNoProp: 'Number',
          documentType: 'Requisition',
          documentStatusProp: 'ApprovalStatus',
          informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
        }
      }
    },

    'Budget': {
      itemProp: 'No',
      linkItemType: 'Budget',
      itemConfig: {
        title: 'Budget Request',
        recordId: "No",
        recordTitle: "No",
        headerConfig: BudgetRequestHeadedr,
        lineConfig: BudgetRequestLine,
        informationSectionConfig: {
          documentNoProp: 'No',
          documentType: 'Budget',
          documentStatusProp: 'Status',
          informationDetailSecctionType: InformationDetailSecctionType.JournalClaim
        }
      }
    },

    'Sales Invoice': {
      itemProp: 'Number',
      linkItemType: 'Sales Invoice',
      itemConfig: {
        title: 'Sales Invoice',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: SalesInvoiveHeader,
        lineConfig: SalesInvoiceLine,
        calculationSectionConfig: SalesInvoicecalculation,
        informationSectionConfig: {
          documentNoProp: 'Number',
          documentType: 'Sales Invoice',
          documentStatusProp: 'Status',
          informationDetailSecctionType: InformationDetailSecctionType.SalesInvoice
        }
      }
    },

    'Sales Order': {
      itemProp: 'Number',
      linkItemType: 'Sales Order',
      itemConfig: {
        title: 'Sales Order',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: SalesOrderHeader,
        lineConfig: SalesOrderLine,
        calculationSectionConfig: SalesOrderCalculation,
        informationSectionConfig: {
          documentNoProp: 'Number',
          documentType: 'Order',
          documentStatusProp: 'status',
          informationDetailSecctionType: InformationDetailSecctionType.SalesInvoice
        }
      }
    },

    'Petty Cash': {
      itemProp: 'DocumentNo',
      linkItemType: 'Petty Cash',
      itemConfig: {
        title: 'Petty Cash',
        recordId: "DocumentNo",
        recordTitle: "DocumentNo",
        headerConfig: ClaimJournalHeader,
        lineConfig: ClaimJournalLine,
        informationSectionConfig: {
          documentNoProp: 'DocumentNo',
          documentType: 'Petty Cash',
          documentStatusProp: 'Status',
          informationDetailSecctionType: InformationDetailSecctionType.JournalClaim
        }
      }
    },

    'BW Requisition': {
      itemProp: 'Number',
      linkItemType: 'BW Requisition',
      itemConfig: {
        title: 'PR Bid Waiver',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: PRBidWaiverHeader,
        lineConfig: PRBidWaiverLine,
        calculationSectionConfig: PRBidWaiverCalculation,
        informationSectionConfig: {
          documentNoProp: 'Number',
          documentType: 'BW Requisition',
          documentStatusProp: 'ApprovalStatus',
          informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
        }
      }
    },

    'Invoice': {
      itemProp: 'Number',
      linkItemType: 'Invoice',
      itemConfig: {
        title: 'Purchase Invoice',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: PurchaseInvoiceHeader,
        lineConfig: PurchaseInvoiceLine,
        calculationSectionConfig: PurchaseInvoiceCalculation,
        informationSectionConfig: {
          documentNoProp: 'Number',
          documentType: 'Invoice',
          documentStatusProp: 'Status',
          informationDetailSecctionType: InformationDetailSecctionType.PurchaseInvoice
        }
      }
    },

    'Quote': {
      itemProp: 'Number',
      linkItemType: 'Quote',
      itemConfig: {
        title: 'Purchase Quote',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: PurchaseQuoteHeader,
        lineConfig: PurchaseQuoteLine,
        informationSectionConfig: {
          documentNoProp: 'Number',
          documentType: 'Quote',
          documentStatusProp: 'Status',
          informationDetailSecctionType: InformationDetailSecctionType.PurchaseQuote
        }
      }
    },

    'Order': {
      itemProp: 'Number',
      linkItemType: 'Order',
      itemConfig: {
        title: 'Purchase Order',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: PurchaseOrderHeader,
        lineConfig: PurchaseOrderLine,
        calculationSectionConfig: PurchaseOrderCalculation,
        informationSectionConfig: {
          documentNoProp: 'Number',
          documentType: 'Order',
          documentStatusProp: 'Status',
          informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrder
        }
      }
    },

    'Employee Claim': {
      itemProp: 'claimNo',
      linkItemType: 'Employee Claim',
      itemConfig: {
        title: 'Employee Claim',
        recordId: "claimNo",
        recordTitle: "claimNo",
        headerConfig: EmployeeClaimHeader,
        lineConfig: EmployeeClaimLime,
        calculationSectionConfig: EmployeeClaimCalculation,
        informationSectionConfig: {
          documentNoProp: 'claimNo',
          documentType: 'Employee Claim',
          documentStatusProp: 'EmployeeClaim',
          informationDetailSecctionType: InformationDetailSecctionType.EmployeeClaim
        }
      }
    },

    'Claim Payment': {
      itemProp: 'batchNo',
      linkItemType: 'Claim Payment',
      itemConfig: {
        title: 'Claim Payment',
        recordId: "claimNo",
        recordTitle: "claimNo",
        headerConfig: ClaimPaymentHeader,
        lineConfig: ClaimPaymentLine,
        calculationSectionConfig: ClaimPaymentCalculation,
        informationSectionConfig: {
          documentNoProp: 'batchNo',
          documentType: 'Claim Payment',
          documentStatusProp: 'ClaimPayment',
        }
      }
    },

    'RFQ Vendor': {
      itemProp: 'Number',
      linkItemType: 'RFQ Vendor',
      itemConfig: RfqVendorItemConfig
    }
  },


  purchaseOrder: {
    pageName: 'PO',
    component: PurchaseOrderComponent,
    getListConfig: () => ({
      title: 'Purchase Order',
      idProp: 'Id',
      headerApi: '/purchaseOrderHeaders',
      pageName: 'PO',
      headerApiOrderByField: 'Number',
      headers: [
        { name: 'Number', prop: 'Number', isPrimaryLink: true },
        { name: 'Status', prop: 'Status' },
        { name: 'Order Date', prop: 'OrderDate' }
      ],
      selctionType: 'single',
      showCopy: true,
      addItemConfig: {
        title: 'Purchase Order',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: PurchaseOrderHeader,
        lineConfig: PurchaseOrderLine,
        calculationSectionConfig: PurchaseOrderCalculation
      }
    }),
    getCardConfig: () => ({
      title: 'Purchase Order',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: PurchaseOrderHeader,
      lineConfig: PurchaseOrderLine,
      calculationSectionConfig: PurchaseOrderCalculation
    })
  },

  purchaseRequisition: {
    pageName: 'PR',
    component: PurchaseRequisitionComponent,
    getListConfig: () => ({
      title: 'Purchase Requisition',
      idProp: 'Id',
      headerApi: '/purchaseRequisitionHeaders',
      pageName: 'PR',
      headerApiOrderByField: 'Number',
      showTableBackButton: true,
      buttons: [
        {
          label: 'Combined PR',
          name: 'CombinedPR',
          icon: 'bi bi-intersect',
          allowMultiple: true
        }
      ],
      filters: [
        { field: 'ApprovalStatus', operator: 'ne', value: "'Approved'" },
        { field: 'ApprovalStatus', operator: 'ne', value: "'Archived'" },
        { field: 'DocumentType', operator: 'eq', value: "'Requisition'" }
      ],
      headers: PurchaseRequisitionListHeaders,
      selctionType: 'multiple',
      addItemConfig: {
        title: 'Purchase Requisition',
        recordId: "Number",
        recordTitle: "Number",
        headerConfig: PurchaseRequisitionHeader,
        lineConfig: PurchaseRequisitionLine,
        calculationSectionConfig: PurchaseRequisitionCalculation
      }
    }),
    getCardConfig: () => ({
      title: 'Purchase Requisition',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: PurchaseRequisitionHeader,
      lineConfig: PurchaseRequisitionLine,
      calculationSectionConfig: PurchaseRequisitionCalculation
    })
  },

  rfqVendor: {
    pageName: 'RFQ-VENDOR',
    getCardConfig: () => ({
      ...RfqVendorItemConfig
    })
  },


  combinedRequisitionCombine: {
    pageName: 'COMBINED-REQUISITION',
    component: CombinedRequisitionComponent,
    getListConfig: () => ({
      title: 'Purchase Requisition',
      idProp: 'Id',
      headerApi: '/purchaseRequisitionHeaders',
      pageName: 'COMBINED-REQUISITION',
      headerApiOrderByField: 'Number',
      showTableBackButton: true,
      enableCache: false,
      buttons: [
        {
          label: 'Combined PR',
          name: 'CombinedPR',
          icon: 'bi bi-intersect',
          allowMultiple: true
        }
      ],
      filters: [
        { field: 'ApprovalStatus', operator: 'ne', value: "'Approved'" },
        { field: 'ApprovalStatus', operator: 'ne', value: "'Archived'" },
        { field: 'DocumentType', operator: 'eq', value: "'Requisition'" },
        { field: 'isCombinedPr', operator: 'eq', value: "false" },
        { field: 'isCombinedPrHeader', operator: 'eq', value: "false" }

      ],
      headers: PurchaseRequisitionListHeaders,
      selctionType: 'multiple',
      addItemConfig: {
        title: 'Purchase Requisition',
        recordId: 'Number',
        recordTitle: 'Number',
        headerConfig: CombinedRequisitionHeader,
        lineConfig: CombinedRequisitionLine,
        calculationSectionConfig: CombinedRequisitionCalculation,
      }
    }),
    getCardConfig: () => ({
      title: 'Purchase Requisition',
      recordId: 'Number',
      recordTitle: 'Number',
      headerConfig: CombinedRequisitionHeader,
      lineConfig: CombinedRequisitionLine,
      calculationSectionConfig: CombinedRequisitionCalculation,
    })
  },




  changeAllocation: {
    component: ChangeAllocationsComponent,
    getListConfig: () => null,
    getCardConfig: () => ({
      title: 'Change Allocation',
      recordId: "systemId",
      recordTitle: "Account No",
      headerConfig: ChangeAllocationHeader,
      lineConfig: ChangeAllocationLine,
      disableHeaderApi: true,
      headerInitialValues: null,
      hasNoHeaderApi: true,
      isDirectApi: true,
      getPopupCloseResponse: true
    })
  },


  employeeClaim: {
    component: EmployeeClaimComponent,
    getListConfig: () => null,
    getCardConfig: () => ({
      title: 'Employee Claim',
      recordId: "claimNo",
      recordTitle: "claimNo",
      // headerConfig: EmployeeClaimHeader,
      lineConfig: rejectLineConfig,
      disableHeaderApi: true,
      headerInitialValues: null,
      hasNoHeaderApi: true,
      isDirectApi: true,
      //getPopupCloseResponse: true
    })
  },


  PrePayment: {
    component: PrepaymentComponent,
    getListConfig: () => null,
    getCardConfig: () => ({
      title: 'Prepayment',
      recordId: "systemId",
      headerConfig: RedistributePrePaymentHeader,
      lineConfig: RedistributePrePaymentLine,
      disableHeaderApi: true,
      headerInitialValues: null,
      hasNoHeaderApi: true,
      isDirectApi: true,
      getPopupCloseResponse: false
    })
  },

  dimensionRules: {
    getListConfig: () => null,
    getCardConfig: () => ({
      title: 'Dimension Rules',
      recordId: 'systemId',
      hasNoHeaderApi: true,
      isDirectApi: true,
      lineConfig: DimensionRulesLines,
      hideSubPopupHeader: true,
      hideSubPopupCalculation: true,
      getPopupCloseResponse: false
    })
  },

  buttonPermission: {
    component: ButtonPermissionComponent,
    getListConfig: () => null,
    getCardConfig: () => ({
      title: 'Button Permission',
      recordId: "systemId",
      recordTitle: "Account No",
      // headerConfig: ChangeAllocationHeader,
      lineConfig: ButtonPermissionLine,
      disableHeaderApi: true,
      headerInitialValues: null,
      hasNoHeaderApi: true,
      isDirectApi: true,
    })
  },



  Invoice: {
    pageName: 'PI',
    component: PurchaseInvoiceComponent,
    getCardConfig: () => ({
      title: 'Purchase Invoice',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: PurchaseInvoiceHeader,
      lineConfig: PurchaseInvoiceLine,
      calculationSectionConfig: PurchaseInvoiceCalculation,
    })
  },


  empClaim: {
    pageName: 'EMP CLAIM',
    component: EmployeeClaimComponent,
    getCardConfig: () => ({
      title: 'Employee Claim',
      recordId: "claimNo",
      recordTitle: "claimNo",
      headerConfig: EmployeeClaimHeader,
      lineConfig: EmployeeClaimLime,
      calculationSectionConfig: EmployeeClaimCalculation,
    })
  },

  approvalEntry: {
    pageName: 'APPROVAL ENTRIES',
    component: ApprovalEntryComponent,
    menuButtons: [
      {
        label: 'Approved',
        name: 'Approved',
        icon: 'bi bi-check',
      },
      {
        label: 'Reject',
        name: 'Reject',
        icon: 'bi bi-x',
      },
    ],
    getCardConfig: () => ({
      component: ApprovalEntryComponent,
      title: 'Approval Entry',
      recordId: "entryId",
      recordTitle: "Entry ID",
      headerConfig: ApprovalEntryHeader,
    })
  },

  claimRuleSetup: {
    pageName: 'CLAIM_RULE_SETUP',
    component: ClaimRuleSetupComponent,
    menuButtons: [
      {
        label: 'Suggest Rules',
        name: 'Suggest Rules',
        icon: 'bi bi-gear',
      },
    ],
    getCardConfig: () => ({
      component: ClaimRuleSetupComponent,
      title: 'Claim Rule',
      recordId: 'claimTypeCode',
      recordTitle: 'claimTypeCode',
      headerConfig: ClaimRuleConfig
    })
  },


};

