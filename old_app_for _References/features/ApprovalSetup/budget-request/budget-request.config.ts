import { FormFieldType } from "../../../core/models/shared/formField.enum"
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config"
import { LineDataConfig } from "../../../core/models/shared/line-data.config"


export const BudgetRequestHeadedr: HeaderDataConfig = {
    idProp: 'Id',
    api: '/budgetRequests',
    title: 'Budget Request',
    autoGenerateField: 'No',
    buttons: [
        {
            label: 'SendApprovalRequest',
            name: 'Send Approval Request',
            icon: 'bi bi-envelope'
        },
        {
            label: 'CancelApprovalRequest',
            name: 'Cancel Approval Request',
            icon: 'bi bi-envelope'
        },
    ],
    sections: [
        {
            title: 'Requisition Header Details',
            controls: [
                [
                    {
                        type: FormFieldType.TextBox,
                        label: 'No',
                        name: 'No',
                        required: true,
                        disabled: true
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'DocumentType',
                        name: 'Document Type',
                        required: true,
                        disabled: true
                    },
                    {
                        type: FormFieldType.DateTime,
                        label: 'RequestDate',
                        name: 'Request Date',
                        dateOnly: true,
                        defaultSystemDate: true
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'BudgetDocumentType',
                        name: 'Budget Document Type',
                        required: true,
                        items: [
                            { value: 'Requisition', name: 'Purchase Requisition' },
                            { value: 'BW Requisition', name: 'PR Bid Waiver' },
                            { value: 'Invoice', name: 'Purchase Invoice' },
                            { value: 'Petty Cash', name: 'Petty Cash' }
                        ],
                        bindLabel: 'name',
                        bindValue: 'value'
                    },
                    {
                        type: FormFieldType.TextBox,
                        label: 'Status',
                        name: 'Status',
                        readonly: true
                    },
                    {
                        type: FormFieldType.TextArea,
                        label: 'Remark',
                        name: 'Remark',
                        isDescription: true,
                        maxlength: 100
                    },
                    {
                        type: FormFieldType.DropDown,
                        label: 'BudgetOptions',
                        name: 'Budget Options',
                        items: [
                            { value: 'Budget Addition', name: 'Budget Addition' },
                            { value: 'Budget Reallocation', name: 'Budget Reallocation' },
                            { value: 'Budget Addition & Reallocation', name: 'Budget Addition & Reallocation' }
                        ],
                        bindLabel: 'name',
                        bindValue: 'value'
                    },
                    {
                        type: FormFieldType.TextArea,
                        label: 'RejectReason',
                        name: 'Approvers Comments',
                        disabled: true,
                        readonly: true
                    },
                    {
                        type: FormFieldType.TextArea,
                        label: 'PendingApproversID',
                        name: 'Pending Approvers ID',
                        readonly: true
                    }
                ]
            ]
        }
    ]
}
BudgetRequestHeadedr.controls = (BudgetRequestHeadedr.sections ?? []).flatMap(section => section.controls);

export const BudgetRequestLine: LineDataConfig = {
    idProp: 'Id',
    headerPKProp: 'No',
    lineFKProp: 'BudgetRequestNo',
    api: '/budgetRequestLines',
    includeHeaderId: true,
    controls: [
        {
            type: FormFieldType.DropDown,
            label: 'DocumentNo',
            name: 'Document No',
            // apiUrl: '/purchaseRequisitionHeaders',
            // bindValue: 'Number',
            // displayFormat: '[Number]',
            required: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'AccountType',
            name: 'Account Type',
            initialValue: 'G/L Account',
            readonly: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'AccountNo',
            name: 'Account No',
            required: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'Description',
            name: 'Description',
            readonly: true,
            required: true,
            isDescription: true,
            maxlength: 100
        },
        {
            type: FormFieldType.TextBox,
            label: 'GLAccountName',
            name: 'G/L Account Name',
            readonly: true,
            isDescription: true,
            maxlength: 100
        },
        {
            type: FormFieldType.Number,
            label: 'Amount',
            name: 'Requested Amount',
            decimal: true,
            required: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'Remark',
            name: 'Remark',
        },
    ]
}        