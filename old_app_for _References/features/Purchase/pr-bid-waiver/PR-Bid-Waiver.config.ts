import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const PRBidWaiverHeader: HeaderDataConfig = {
    idProp: 'Id',
    api: '/bwRequisitionHeaders',
    title: 'PR Bid Waiver',
    autoGenerateField: 'Number',
    buttons: [
        {
            label: 'SendApprovalRequest',
            name: 'Send Approval Request',
            icon: 'bi bi-send'
        },
        {
            label: 'CancelApprovalRequest',
            name: 'Cancel Approval Request',
            icon: 'bi bi-x-circle'
        },
        // {
        //     label: 'BidWaiverRequired',
        //     name: 'Bid Waiver Required',
        //     icon: 'bi bi-envelope'
        // }
        {
            label: 'ProtalSendApprovalRequest',
            name: 'Portal Send Approval Request',
            icon: 'bi bi-send'
        },
        {
            label: 'PortalCancelApprovalRequest',
            name: 'Portal Cancel Approval Request',
            icon: 'bi bi-x-circle'
        },

    ],
    sections: [
        {
            title: 'Requisition Information',
            controls: [
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'Number',
                        name: 'Purchase Requisition No',
                        required: true,
                        readonly: true
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'ApprovalStatus',
                        name: 'Approval Status',
                        initialValue: 'Open',
                        readonly: true
                    }
                ],
                [
                    {
                        type: FormFieldType.DateTime,
                        label: 'RequisitionDate',
                        name: 'Requisition Date',
                        dateOnly: true,
                        defaultSystemDate: true
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'DocumentType',
                        name: 'Document Type',
                        readonly: true
                    }
                ]
            ]
        },
        {
            title: 'Remarks and Approvals',
            controls: [
                [
                    {
                        type: FormFieldType.TextArea,
                        label: 'Remark',
                        name: 'Remark',
                        isDescription: true,
                        maxlength: 500
                    },
                    {
                        type: FormFieldType.TextArea,
                        label: 'PendingApproversID',
                        name: 'Pending Approvers ID',
                        readonly: true
                    }
                ],
                [
                    {
                        type: FormFieldType.TextArea,
                        label: 'RejectReason',
                        name: 'Approvers Comments',
                        readonly: true
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'BudgetName',
                        name: 'Budget Name',
                        apiUrl: '/glbudgetlists',
                        displayFormat: '[BudgetName] - [description]',
                        bindValue: 'BudgetName'
                    }
                ]
            ]
        },
        {
            title: 'Additional Details',
            controls: [
                [
                    {
                        type: FormFieldType.DropDown,
                        label: 'Reason',
                        name: 'Bid waiver reason',
                        apiUrl: '/portalReasons',
                        displayFormat: '[Code] - [Description]',
                        bindValue: 'Code'
                    },
                    {
                        type: FormFieldType.DateTime,
                        label: 'DeliveryDate',
                        name: 'Delivery Date',
                        dateOnly: true,
                        defaultSystemDate: true
                    }
                ]
            ]
        }
    ]
    ,
    removeUnicodeCharFields: ['DocumentType']
};
PRBidWaiverHeader.controls = (PRBidWaiverHeader.sections ?? []).flatMap(section => section.controls);


export const PRBidWaiverLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'Number',
    lineFKProp: 'PurchaseRequisitionNumber',
    api: '/bwRequisitionLines',
    includeHeaderId: true,
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'PurchaseRequisitionType',
            name: 'Type',
            items: [{
                value: 'G/L Account',
                name: 'G/L Account'
            },
            // {
            //     value: 'Item',
            //     name: 'Item'
            // }, {
            //     value: 'Fixed Asset',
            //     name: 'Fixed Asset'
            // }, {
            //     value: 'Charge (Item)',
            //     name: 'Charge (Item)'
            // },
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
            disabled: true,
            required: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'Description',
            name: 'Description',
            required: true,
            isDescription: true,
            maxlength: 100
        },
        {
            type: FormFieldType.DropDown,
            label: 'UnitOfMeasure',
            name: 'Unit Of Measure',
            apiUrl: '/unitOfMeasures',
            bindValue: 'Code',
            displayFormat: '[Code] - [Description]',
            required: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'LocationCode',
            name: 'Location',
            apiUrl: '/locations',
            bindValue: 'Code',
            displayFormat: '[Code] - [Name]',
            required: true
        },
        {
            type: FormFieldType.Number,
            label: 'Quantity',
            name: 'Quantity',
            decimal: true,
            required: true
        },
        {
            type: FormFieldType.Number,
            label: 'UnitPrice',
            name: 'Unit Cost',
            decimal: true,
            required: true
        },
        {
            type: FormFieldType.Number,
            label: 'Amount',
            name: 'Amount',
            decimal: true,
            required: true,
            readonly: true
        }
    ],
    removeUnicodeCharFields: ['PurchaseRequisitionType']
}

export const PRBidWaiverCalculation: CalculationSectionConfig = {
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