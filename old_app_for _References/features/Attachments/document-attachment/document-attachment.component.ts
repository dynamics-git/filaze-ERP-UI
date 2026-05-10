
import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../../Purchase/purchase-requisition/purchase-requisition.config';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { BudgetRequestHeadedr, BudgetRequestLine } from '../../ApprovalSetup/budget-request/budget-request.config';
import { SalesInvoicecalculation, SalesInvoiceLine, SalesInvoiveHeader } from '../../sales/sales-invoice/sales-invoice.config';
import { ClaimJournalHeader, ClaimJournalLine } from '../../Journal/journal-claim/journal-claim.config';
import { PRBidWaiverCalculation, PRBidWaiverHeader, PRBidWaiverLine } from '../../Purchase/pr-bid-waiver/PR-Bid-Waiver.config';
import { PurchaseInvoiceCalculation, PurchaseInvoiceHeader, PurchaseInvoiceLine } from '../../Purchase/purchase-invoice/purchase-invoice.config';
import { PurchaseQuoteHeader, PurchaseQuoteLine } from '../../Purchase/purchase-quote/purchase-quote.config';
import { PurchaseOrderCalculation, PurchaseOrderHeader, PurchaseOrderLine } from '../../Purchase/purchase-order/purchase-order.config';
import { PurchaseRequisitionComponent } from '../../Purchase/purchase-requisition/purchase-requisition.component';
import { BudgetRequestComponent } from '../../ApprovalSetup/budget-request/budget-request.component';
import { SalesInvoiceComponent } from '../../sales/sales-invoice/sales-invoice.component';
import { JournalClaimComponent } from '../../Journal/journal-claim/journal-claim.component';
import { PRBidWaiverComponent } from '../../Purchase/pr-bid-waiver/pr-bid-waiver.component';
import { PurchaseInvoiceComponent } from '../../Purchase/purchase-invoice/purchase-invoice.component';
import { ChangeAllocationsComponent } from '../../Purchase/change-allocations/change-allocations.component';
import { PrepaymentComponent } from '../../Purchase/pre-payment/pre-payment.component';
import { PurchaseQuoteComponent } from '../../Purchase/purchase-quote/purchase-quote.component';
import { PurchaseOrderComponent } from '../../Purchase/purchase-order/purchase-order.component';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { EventDataModel } from '../../../core/models/shared/eventDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { CustomSharedService } from '../../../core/services/shared/custom-shared.service';
import { DrawerService } from '../../../layout/shell/header/elements/drawer/drawer.service';
import { SelectedRowIndexService } from '../../../core/services/shared/selected-row-index.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';

@Component({
  standalone: false,
    selector: 'app-document-attchment',
    template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class DocumentAttchmentComponent implements OnInit {

    config: DataTableConfig = {
        title: 'Document Attachment',
        idProp: 'Id',
        headerApi: '/portalDocumentAttachments',
        fileUrlProp: 'FileUrl',
        fileDeleteApi: '/portalDocumentAttachments',
        pageName: 'DocumentAttachments',
        filterByUserCompanyResCenter: true,
        showCreate: false,
        showEdit: false,
        headers: [
            {
                name: 'Document Type',
                prop: 'DocumentType'
            },
            {
                name: 'Document No',
                prop: 'No',
                isPrimaryLink: true,
                linkItemConfigs: [
                    {
                        property: 'DocumentType',
                        value: 'Requisition',
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
                    {
                        property: 'DocumentType',
                        value: 'Budget',
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
                    {
                        property: 'DocumentType',
                        value: 'Sales Invoice',
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
                    {
                        property: 'DocumentType',
                        value: 'Petty Cash',
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
                    {
                        property: 'DocumentType',
                        value: 'BW Requisition',
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
                    {
                        property: 'DocumentType',
                        value: 'Invoice',
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
                    {
                        property: 'DocumentType',
                        value: 'Quote',
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
                            },
                        }
                    },
                    {
                        property: 'DocumentType',
                        value: 'Order',
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
                    }
                ]
            },
            {
                name: 'Document Attachment Type',
                prop: 'DocumentsAttachmentType'
            },
            {
                name: 'File Name',
                prop: 'FileName',
                urlProp: 'FileUrl'
            },
            {
                name: 'File Type',
                prop: 'FileType'
            }
        ],
        selctionType: 'single',
    };

    MenuButtons: Menubuttons[] = [
        {
            label: 'Document Attachment Types',
            name: 'Document Attachment Types',
            icon: 'bi bi-arrow-90deg-right',
            route: '/attachments/types',
        },
        {
            label: 'Document Attachment',
            name: 'Document Attachment',
            icon: 'bi bi-arrow-90deg-right',
            route: '/attachments/documents',
            isEnable: false
        },
    ];

    purchaseRequisitionObj!: PurchaseRequisitionComponent;
    budgetRequestObj!: BudgetRequestComponent;
    salesInvoiceObj!: SalesInvoiceComponent;
    journalClaimObj!: JournalClaimComponent;
    prBidWaiverObj!: PRBidWaiverComponent;
    purchaseInvoiceObj!: PurchaseInvoiceComponent;
    purchaseQuoteObj!: PurchaseQuoteComponent;
    purchaseOrderObj!: PurchaseOrderComponent;

    constructor(private restService: RestService,
        private toastr: ToastrService,
        private modal: NgbModal,
        private formFielService: FormFieldService,
        private formDataService: FormDataService,
        private sessionService: SessionService,
        private emailNotifyService: EmailNotifyService,
        private router: Router,
        private addItemService: AddItemService,
        private utility: Utility,
        private datePipe: DatePipe,
        private cdr: ChangeDetectorRef,
        private selectedItemService: SelectedItemService,
        private universalPopupService: UniversalPopupService,
        private customSharedService: CustomSharedService,
        private dialogService: UnifiedDialogService,
        private drawerService: DrawerService,
        private selectedRowIndexService:SelectedRowIndexService
    ) {
    }

    ngOnInit() {
        this.purchaseRequisitionObj = new PurchaseRequisitionComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
        this.budgetRequestObj = new BudgetRequestComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.emailNotifyService, this.utility, this.sessionService);
        this.salesInvoiceObj = new SalesInvoiceComponent(this.restService, this.toastr, this.modal, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility);
        this.journalClaimObj = new JournalClaimComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.utility, this.sessionService, this.emailNotifyService);
        this.prBidWaiverObj = new PRBidWaiverComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility);
        this.purchaseInvoiceObj = new PurchaseInvoiceComponent(this.restService, this.toastr, this.modal, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService, this.universalPopupService, this.customSharedService, this.dialogService, this.selectedRowIndexService, new ChangeAllocationsComponent(this.formDataService, this.restService, this.toastr, this.dialogService, this.addItemService), new PrepaymentComponent(this.formDataService, this.restService, this.toastr, this.dialogService, this.addItemService));
        this.purchaseQuoteObj = new PurchaseQuoteComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
        this.purchaseOrderObj = new PurchaseOrderComponent(this.restService, this.toastr, this.modal, this.formFielService, this.formDataService, this.addItemService, this.datePipe, this.utility, this.sessionService, this.emailNotifyService, this.selectedItemService,);
    }

    popupLoaded(data: any) {
        if (data.linkItemType === 'Requisition') {
            this.purchaseRequisitionObj.popupLoaded(data);
        } else if (data.linkItemType === 'Budget') {
            this.budgetRequestObj.popupLoaded(data);
        } else if (data.linkItemType === 'Sales Invoice') {
            this.salesInvoiceObj.popupLoaded(data);
        } else if (data.linkItemType === 'Petty Cash') {
            this.journalClaimObj.popupLoaded(data);
        } else if (data.linkItemType === 'BW Requisition') {
            this.prBidWaiverObj.popupLoaded(data);
        } else if (data.linkItemType === 'Invoice') {
            this.purchaseInvoiceObj.popupLoaded(data);
        } else if (data.linkItemType === 'Quote') {
            this.purchaseQuoteObj.popupLoaded(data);
        } else if (data.linkItemType === 'Order') {
            this.purchaseOrderObj.popupLoaded(data);
        }
    }

    changeEvent(data: EventDataModel) {
        if (data.linkItemType === 'Requisition') {
            this.purchaseRequisitionObj.changeEvent(data);
        } else if (data.linkItemType === 'Budget') {
            this.budgetRequestObj.changeEvent(data);
        } else if (data.linkItemType === 'Sales Invoice') {
            this.salesInvoiceObj.changeEvent(data);
        } else if (data.linkItemType === 'Petty Cash') {
            this.journalClaimObj.changeEvent(data);
        } else if (data.linkItemType === 'BW Requisition') {
            this.prBidWaiverObj.changeEvent(data);
        } else if (data.linkItemType === 'Invoice') {
            this.purchaseInvoiceObj.changeEvent(data);
        } else if (data.linkItemType === 'Quote') {
            this.purchaseQuoteObj.changeEvent(data);
        } else if (data.linkItemType === 'Order') {
            this.purchaseOrderObj.changeEvent(data);
        }
    }

    buttonClickEvent(buttonData: CustomButtonEvent) {
        if (buttonData.linkItemType === 'Requisition') {
            this.purchaseRequisitionObj.buttonClickEvent(buttonData);
        } else if (buttonData.linkItemType === 'Budget') {
            this.budgetRequestObj.buttonClickEvent(buttonData);
        } else if (buttonData.linkItemType === 'Sales Invoice') {
            this.salesInvoiceObj.buttonClickEvent(buttonData);
        } else if (buttonData.linkItemType === 'Petty Cash') {
            this.journalClaimObj.buttonClickEvent(buttonData);
        } else if (buttonData.linkItemType === 'BW Requisition') {
            this.prBidWaiverObj.buttonClickEvent(buttonData);
        } else if (buttonData.linkItemType === 'Invoice') {
            this.purchaseInvoiceObj.buttonClickEvent(buttonData);
        } else if (buttonData.linkItemType === 'Quote') {
            this.purchaseQuoteObj.buttonClickEvent(buttonData);
        } else if (buttonData.linkItemType === 'Order') {
            this.purchaseOrderObj.buttonClickEvent(buttonData);
        }
    }
}
