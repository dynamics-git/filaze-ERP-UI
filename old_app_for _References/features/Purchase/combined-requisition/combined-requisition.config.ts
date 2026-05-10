import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { InformationDetailSecctionType } from "../../../core/models/shared/information-section.enum";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const CombinedRequisitionListHeaders = [
    { name: 'Number', prop: 'Number', isPrimaryLink: true },
    { name: 'Requisition Date', prop: 'RequisitionDate' },
    { name: 'Created By', prop: 'CreatedBy' },
    { name: 'Requester Name', prop: 'requesterName' },
    { name: 'Department', prop: 'department' },
    { name: 'Budget Name', prop: 'BudgetName' },
    { name: 'Budget Code', prop: 'budgetCode' },
    { name: 'Total Amount', prop: 'totalAmount' },
    { name: 'Approval Status', prop: 'ApprovalStatus' },
    { name: 'Procurement Status', prop: 'procurementStatus' },
    { name: 'Sourcing Status', prop: 'sourcingStatus' },
    { name: 'Procurement Method', prop: 'procurementMethod' },
    { name: 'Selected Vendor Name', prop: 'selectedVendorName' },
    { name: 'Purchase Order No', prop: 'purchaseOrderNo' },
    { name: 'PO Creation Status', prop: 'poCreationStatus' },
    { name: 'Last Modified', prop: 'modifiedDateTime' },
];

export const CombinedRequisitionHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/purchaseRequisitionHeaders',
    title: 'Combined Requisition',
    autoGenerateField: 'Number',
    commandBar: {
        maxPrimaryActions: 3,
        maxVisibleGroups: 3
    },
    buttons: [
        // {
        //     label: 'SendApprovalRequest',
        //     name: 'Send Approval Request',
        //     icon: 'bi bi-send' // Represents action of sending
        // },
        // {
        //     label: 'CancelApprovalRequest',
        //     name: 'Cancel Approval Request',
        //     icon: 'bi bi-x-circle' // Represents cancel/reject
        // },

        // {
        //   label: 'DownloadPdf',
        //   name: 'Download Pdf',
        //   icon: 'bi bi-file-pdf' // Correct as-is, already a perfect match
        // },
        {
            label: 'SubmitWorkflow',
            name: 'Submit Workflow',
            icon: 'bi bi-send',
            isVisible: false,
            group: 'Approval',
            order: 10
        },
        {
            label: 'CancelWorkflow',
            name: 'Cancel Workflow',
            icon: 'bi bi-x-circle',
            isVisible: false,
            group: 'Approval',
            order: 20
        },
        {
            label: 'StartProcurementReview',
            name: 'Start Procurement Review',
            icon: 'bi bi-play-circle',
            isVisible: false,
            group: 'Process',
            isPrimary: true,
            order: 30
        },
        {
            label: 'SetProcurementMethod',
            name: 'Set Procurement Method',
            icon: 'bi bi-sliders',
            isVisible: false,
            group: 'Process',
            isPrimary: true,
            order: 40
        },
        {
            label: 'InviteVendors',
            name: 'Invite Vendors',
            icon: 'bi bi-send',
            isVisible: false,
            group: 'Review',
            order: 45
        },
        {
            label: 'MarkVendorSelected',
            name: 'Mark Vendor Selected',
            icon: 'bi bi-person-check',
            isVisible: false,
            group: 'Review',
            order: 50
        },
        {
            label: 'ConvertPurchaseRequisitionToQuote',
            name: 'Convert To Quote',
            icon: 'bi bi-file-earmark-text',
            isVisible: true,
            group: 'Process',
            order: 55
        },
        {
            label: 'ConvertPurchaseRequisitionToOrder',
            name: 'Convert To Order',
            icon: 'bi bi-box-arrow-right',
            isVisible: false,
            group: 'Process',
            isPrimary: true,
            order: 60
        }
    ],
    sections: [
        {
            title: 'Request Summary',
            controls: [
                [/* Purchase Requisition No */ { type: FormFieldType.TextBox, label: 'Number', name: 'Purchase Requisition No', required: true, readonly: true },
       /* Approval Status */         { type: FormFieldType.TextBox, label: 'ApprovalStatus', name: 'Approval Status', initialValue: 'Open', readonly: true, copyResetValue: 'Open' }],

                [/* Requisition Date */        { type: FormFieldType.DateTime, label: 'RequisitionDate', name: 'Requisition Date', dateOnly: true, defaultSystemDate: true },
       /* Delivery Date */           { type: FormFieldType.DateTime, label: 'DeliveryDate', name: 'Requested Delivery Date', dateOnly: true, defaultSystemDate: true }],

                [
                    { type: FormFieldType.TextBox, label: 'priority', name: 'Priority', readonly: true },
                    { type: FormFieldType.TextBox, label: 'DocumentType', name: 'Document Type', readonly: true }
                ],

                [
                    { type: FormFieldType.TextBox, label: 'procurementStatus', name: 'Procurement Status', readonly: true },
                    { type: FormFieldType.TextBox, label: 'sourcingStatus', name: 'Sourcing Status', readonly: true }
                ],

                [
                    { type: FormFieldType.TextBox, label: 'procurementMethod', name: 'Procurement Method', readonly: true },
                    { type: FormFieldType.TextBox, label: 'workflowStatus', name: 'Workflow Status', readonly: true }
                ],
                [
                    { type: FormFieldType.Checkbox, label: 'isCombinedPr', name: 'Combined PR Created ', readonly: true, initialValue: true, },
                    { type: FormFieldType.Checkbox, label: 'isCombinedPrHeader', name: 'Combined PR', readonly: true }
                ],
                [{ type: FormFieldType.TextBox, label: 'combinedPrReference', name: 'Combined PR Reference', readonly: true }]
            ]
        },
        {
            title: 'Requester & Department',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'CreatedBy', name: 'Created By', readonly: true },
                    { type: FormFieldType.TextBox, label: 'requesterName', name: 'Requester Name', readonly: true }
                ],

                [
                    { type: FormFieldType.TextBox, label: 'department', name: 'Department', readonly: true },
                    { type: FormFieldType.TextBox, label: 'PortalResponsibilityCentre', name: 'Responsibility Centre', readonly: true }
                ],

                [
                    { type: FormFieldType.TextBox, label: 'Company', name: 'Company', readonly: true },
                    { type: FormFieldType.TextBox, label: 'currencyCode', name: 'Currency Code', readonly: true }
                ]
            ]
        },
        {
            title: 'Budget & Justification',
            controls: [
                [
                    { type: FormFieldType.DropDown, label: 'BudgetName', name: 'Budget Name', apiUrl: '/glbudgetlists', displayFormat: '[BudgetName] - [description]', bindValue: 'BudgetName' },
                    { type: FormFieldType.TextBox, label: 'budgetCode', name: 'Budget Code', readonly: true }
                ],

                [
                    { type: FormFieldType.TextArea, label: 'Remark', name: 'Remark', copyResetValue: '', isDescription: true, maxlength: 100 },
                    { type: FormFieldType.DropDown, label: 'Reason', name: 'Reason', apiUrl: '/portalReasons', displayFormat: '[Code] - [Description]', bindValue: 'Code' }
                ],

                [
                    { type: FormFieldType.Number, label: 'totalAmount', name: 'Total Amount', readonly: true, decimal: true },
                    { type: FormFieldType.TextArea, label: 'RejectReason', name: 'Approvers Comments', readonly: true, copyResetValue: '' }
                ]
            ]
        },
        {
            title: 'Procurement Review',
            controls: [
                [
                    { type: FormFieldType.TextBox, label: 'procurementMethod', name: 'Procurement Method', readonly: true },
                    {
                        type: FormFieldType.DropDown,
                        label: 'vendorNo',
                        name: 'Vendor No',
                        apiUrl: '/vendorsAPI',
                        bindValue: 'number',
                        displayFormat: '[number] - [displayName]'
                    }
                ],

                [
                    { type: FormFieldType.TextBox, label: 'selectedVendorName', name: 'Selected Vendor Name', readonly: true },
                    { type: FormFieldType.Checkbox, label: 'isVendorRequired', name: 'Is Vendor Required', disabled: true }
                ],

                [
                    { type: FormFieldType.Checkbox, label: 'isVendorSelected', name: 'Is Vendor Selected', disabled: true },
                    { type: FormFieldType.TextBox, label: 'sourcingStatus', name: 'Sourcing Status', readonly: true }
                ],

                [
                    { type: FormFieldType.TextBox, label: 'procurementStatus', name: 'Procurement Status', readonly: true },
                    { type: FormFieldType.TextBox, label: 'selectedVendorNo', name: 'Selected Vendor No', readonly: true }
                ]
            ]
        },
        {
            title: 'Downstream Documents',
            controls: [
                [
                    { type: FormFieldType.Checkbox, label: 'quoteCreated', name: 'Quote Created', disabled: true },
                    { type: FormFieldType.TextBox, label: 'purchaseOrderNo', name: 'Purchase Order No', readonly: true }
                ],

                [
                    { type: FormFieldType.Checkbox, label: 'orderCreated', name: 'Order Created', disabled: true },
                    { type: FormFieldType.TextBox, label: 'poCreationStatus', name: 'PO Creation Status', readonly: true }
                ],

                [
                    { type: FormFieldType.TextBox, label: 'variationOrderNo', name: 'Variation Order No', readonly: true },
                    { type: FormFieldType.DateTime, label: 'modifiedDateTime', name: 'Modified Date Time', readonly: true }
                ],

                [
                    { type: FormFieldType.DateTime, label: 'createdDateTime', name: 'Created Date Time', readonly: true },
                    { type: FormFieldType.TextArea, label: 'PendingApproversID', name: 'Pending Approvers ID', readonly: true, copyResetValue: '' }
                ]
            ]
        }
    ]

};
CombinedRequisitionHeader.controls = (CombinedRequisitionHeader.sections ?? []).flatMap(section => section.controls);


export const CombinedRequisitionLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'Number',
    lineFKProp: 'PurchaseRequisitionNumber',
    api: '/purchseRequisitionLines',
    includeHeaderId: true,
    buttons: [{
        label: 'CombineProcure',
        name: 'Combine Procure',
        icon: 'bi bi-intersect',
    }],
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'PurchaseRequisitionType',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            },
            {
                value: 'Item',
                name: 'Item'
            }, {
                value: 'Fixed Asset',
                name: 'Fixed Asset'
            }, {
                value: 'Charge (Item)',
                name: 'Charge (Item)'
            },
            {
                value: ' ',
                name: 'Comment'
            }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'Number',
            name: 'No',
            required: true,
            autoSave: false
            // disabled: true,   // Amit TSS
            // required: true  //Amit TSS
        },
        {
            type: FormFieldType.TextBox,
            label: 'Description',
            name: 'Description',
            isDescription: true,
            maxlength: 100
        },
        {
            type: FormFieldType.DropDown,
            label: 'UnitOfMeasure',
            name: 'Unit Of Measure',
            apiUrl: '/unitOfMeasures',
            bindValue: 'Code',
            displayFormat: '[Code] - [Description]'
        },
        {
            type: FormFieldType.DropDown,
            label: 'LocationCode',
            name: 'Location',
            apiUrl: '/locations',
            bindValue: 'Code',
            displayFormat: '[Code] - [Name]'
        },
        {
            type: FormFieldType.Number,
            label: 'Quantity',
            name: 'Quantity',
            decimal: true,
            autoSave: false
        },
        {
            type: FormFieldType.Number,
            label: 'UnitPrice',
            name: 'Unit Cost',
            decimal: true,
            autoSave: false
        },
        {
            type: FormFieldType.Number,
            label: 'Amount',
            name: 'Amount',
            decimal: true,
            readonly: true,
            autoSave: false
        },
        {
            type: FormFieldType.DateTime,
            label: 'requiredDate',
            name: 'Required Date',
            dateOnly: true,
            hidden: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'department',
            name: 'Department',
            hidden: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'budgetCode',
            name: 'Budget Code',
            hidden: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'sourcingStatus',
            name: 'Sourcing Status',
            readonly: true,
            hidden: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'selectedVendorName',
            name: 'Selected Vendor Name',
            readonly: true,
            hidden: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'poNo',
            name: 'PO No',
            readonly: true,
            hidden: true
        },
        {
            type: FormFieldType.Number,
            label: 'poLineNo',
            name: 'PO Line No',
            readonly: true,
            hidden: true
        }
    ],
    removeUnicodeCharFields: ['PurchaseRequisitionType']
}

export const CombinedRequisitionCalculation: CalculationSectionConfig = {
    controls: [
        [
            {
                type: FormFieldType.Number,
                label: 'totalAmount',
                name: 'Total Amount',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
                alignRight: true
            }
        ]
    ]
}


export const InviteVendersHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/purchaseRequisitionHeaders',
    title: 'RFQ Vendor',
    autoGenerateField: 'Number',
    commandBar: {
        maxPrimaryActions: 3,
        maxVisibleGroups: 1
    },
    buttons: [{
        label: 'sendInvite',
        name: 'Send Invite',
        icon: 'bi bi-envelope',
        isVisible: false,
        isPrimary: true,
        group: 'Process',
        order: 10
    }, {
        label: 'CompareQuote',
        name: 'Compare Quote',
        icon: 'bi bi-bar-chart',
        isVisible: false,
        isPrimary: true,
        group: 'Process',
        order: 20
    }, {
        label: 'ConvertToQuote',
        name: 'Convert To Quote',
        icon: 'bi bi-arrow-right-circle',
        isVisible: false,
        isPrimary: true,
        group: 'Process',
        order: 30
    }, {
        label: 'ConvertToOrder',
        name: 'Convert To Order',
        icon: 'bi bi-arrow-right-circle',
        isVisible: false,
        isPrimary: false,
        group: 'Process',
        order: 40
    }],
    sections: [
        {
            title: 'General Info',
            controls: [
                [{ type: FormFieldType.TextBox, label: 'Number', name: 'Purchase Requisition No', required: true, readonly: true },
                { type: FormFieldType.TextBox, label: 'CreatedBy', name: 'Created By', }],
                [{ type: FormFieldType.TextBox, label: 'PortalResponsibilityCentre', name: 'Responsibility Centre', },
                { type: FormFieldType.TextBox, label: 'totalAmount', name: 'PR Amount', },],
            ]
        },
    ]

};
InviteVendersHeader.controls = (InviteVendersHeader.sections ?? []).flatMap(section => section.controls);


export const InviteVendersLine: LineDataConfig = {
    idProp: 'systemId',
    headerPKProp: 'Number',
    lineFKProp: 'prNo',
    subPopupFKProp: 'workflowUserId',
    api: '/rfqVendors',
    includeHeaderId: true,
    showExcelExport: false,
    showButtonInfoButton: true,
    attachmentDocumentTypeForLines: 'RFQ Vendors',
    isShowUploaderFile: true,
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'vendorNo',
            name: 'Vendor No',
            apiUrl: '/vendorsAPI',
            bindValue: 'number',
            displayFormat: '[number] - [displayName]'
        },
        {
            type: FormFieldType.TextBox,
            label: 'vendorName',
            name: 'Vendor Name',
            readonly: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'vendorContact',
            name: 'Vendor Contact'
        },
        {
            type: FormFieldType.TextBox,
            label: 'vendorEmail',
            name: 'Vendor Email'
        },
        {
            type: FormFieldType.Number,
            label: 'quotedAmount',
            name: 'Quoted Price',
            decimal: true
        },
        {
            type: FormFieldType.DateTime,
            label: 'deliveryDate',
            name: 'Delivery Date',
            dateOnly: true,
            defaultSystemDate: true
        },
        {
            type: FormFieldType.booleanIcon,
            label: 'isInvited',
            name: 'Invited'
        },
        {
            type: FormFieldType.booleanIcon,
            label: 'isSelected',
            name: 'Selected'
        },
        {
            type: FormFieldType.FileUpload,
            label: 'upload',
            name: 'Upload',
        },
        {
            type: FormFieldType.TextBox,
            label: 'note',
            name: 'Notes'
        },
        {
            type: FormFieldType.TextBox,
            label: 'poNo',
            name: 'Order No.',
            readonly: true,
        }, {
            type: FormFieldType.TextBox,
            label: 'quoteNo',
            name: 'Quote No.',
            readonly: true,
        },

    ],
};

export const RfqVendorItemConfig = {
    title: 'RFQ Vendor',
    recordId: 'Number',
    recordTitle: 'Number',
    headerConfig: InviteVendersHeader,
    lineConfig: InviteVendersLine,
    calculationSectionConfig: CombinedRequisitionCalculation,
    informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Requisition',
        documentStatusProp: 'ApprovalStatus',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition,
        rfqWorkflow: {
            enabled: true,
            vendorNoProp: 'vendorNo',
            vendorNameProp: 'vendorName',
            invitedProp: 'isInvited',
            quotedAmountProp: 'quotedAmount',
            selectedProp: 'isSelected',
            quoteNoProp: 'quoteNo',
            orderNoProp: 'poNo',
            deliveryDateProp: 'deliveryDate',
            deliveryDaysProp: 'deliveryDays',
            quotationDateProp: 'quotationDate'
        }
    }
};
