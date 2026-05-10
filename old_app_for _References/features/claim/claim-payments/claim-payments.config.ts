import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const ClaimPaymentHeader: HeaderDataConfig = {
    idProp: 'systemId',
    api: '/claimPaymentHeaders',
    title: 'Claim Payment',
    autoGenerateField: 'batchNo',
    buttons: [{
        label: 'SendApprovalRequest',
        name: 'Send Approval Request',
        icon: 'bi bi-send' // Represents action of sending
    },
    {
        label: 'CancelApprovalRequest',
        name: 'Cancel Request',
        icon: 'bi bi-x-circle' // Represents cancel/reject
    },
    {
        label: 'submit',
        name: 'Submit',
        icon: 'bi bi-check-circle'
    },
    {
        label: 'reopen',
        name: 'Reopen',
        icon: 'bi bi-arrow-clockwise'
    },
    { name: 'Ready for Payment', label: 'ReadyForPayment', icon: 'bi bi-cash-stack' },
    { name: 'Post', label: 'finalizePost', icon: 'bi bi-check2-square' },
    { name: 'Mark as Paid', label: 'markaspaid', icon: 'bi bi-cash-coin' }
    ],
    sections: [
        {
            title: 'Identification',
            controls: [
                [
                    { type: FormFieldType.TextBox, name: 'Batch No', label: 'batchNo', readonly: true },
                    { type: FormFieldType.DateTime, name: 'Created Date', label: 'createdDate', dateOnly: true, readonly: true, defaultSystemDate: true }
                ],
                [
                    { type: FormFieldType.TextBox, name: 'Created By', label: 'createdBy', readonly: true },
                    {
                        type: FormFieldType.TextBox,
                        name: 'Approval Status',
                        label: 'approvalStatus',
                        readonly: true
                    }
                ],
                [
                    { type: FormFieldType.Number, name: 'Total Claims', label: 'totalClaims', readonly: true },
                    { type: FormFieldType.TextBox, name: 'Batch Status', label: 'batchStatus', readonly: true }
                ],
                [{ type: FormFieldType.DateTime, name: 'Payment Date', label: 'paymentDate', dateOnly: true, defaultSystemDate: true },
                { type: FormFieldType.TextArea, name: 'Remarks', label: 'remarks' }
                ]
            ]
        }
    ],
    removeUnicodeCharFields: ['batchStatus', 'approvalStatus']
};

ClaimPaymentHeader.controls = (ClaimPaymentHeader.sections ?? []).flatMap(section => section.controls);

export const ClaimPaymentLine: LineDataConfig = {
    idProp: 'systemId',
    headerPKProp: 'batchNo',
    lineFKProp: 'batchNo',
    api: '/claimPaymentLines',
    includeHeaderId: true,
    defaultLines: 1,
    showLineAttachments: true,
    lineAttachmentDeletePermission: false,
    relatedDocumentNoProp: 'sourceClaimNo',
    relatedDocumentType: 'Employee Claim',
    relatedLineNoProp: 'sourceLineNo',
    isShowUploaderFile: true,
    buttons: [
    ],
    controls: [
        { type: FormFieldType.TextBox, label: 'claimNo', name: 'Claim No', readonly: true },
        { type: FormFieldType.TextBox, label: 'expenseType', name: 'Expense Type', readonly: true },
        { type: FormFieldType.TextBox, label: 'employeeNo', name: 'Employee No', readonly: true },
        { type: FormFieldType.TextBox, label: 'description', name: 'Description' },
        {
            type: FormFieldType.DropDown,
            name: 'Payment Method',
            label: 'paymentMethod',
            apiUrl: '/paymentMethods?$filter=showInPortal eq true',
            bindLabel: 'code',
            bindValue: 'code',
            readonly: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'vatCode',
            name: 'Vat Code',
            apiUrl: '/vatProdPostingGroups',
            bindValue: 'code',
            displayFormat: '[code]',
            readonly: true
        },
        {
            type: FormFieldType.Number,
            label: 'vat',
            name: 'VAT %',
            readonly: true,
            decimal: true
        },
        {
            type: FormFieldType.Number,
            label: 'taxAmount',
            name: 'Tax Amount',
            decimal: true,
            readonly: true
        },
        { type: FormFieldType.Number, label: 'amount', name: 'Amount', decimal: true, readonly: true },
        {
            type: FormFieldType.Checkbox,
            label: 'paymentProofUploaded',
            name: 'Payment Proof Uploaded',
        },
        {
            type: FormFieldType.TextBox,
            label: 'approvalStatus',
            name: 'Approval Status',
            readonly: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'batchStatus',
            name: 'Batch Status',
            readonly: true
        },
        {
            type: FormFieldType.DropDown,
            label: 'paymentStatus',
            name: 'Payment Status',
            items: [
                { value: '', name: '' },
                { value: 'Paid', name: 'Paid' },
                { value: 'Unpaid', name: 'Unpaid' }
            ],
            bindLabel: 'name',
            bindValue: 'value'
        },
        // { type: FormFieldType.Checkbox, label: 'return', name: 'Return', readonly: true },
        // { type: FormFieldType.TextBox, label: 'returnReason', name: 'Return Reason', readonly: true },
    ],
    removeUnicodeCharFields: ['batchStatus', 'approvalStatus']
}

export const ClaimPaymentCalculation: CalculationSectionConfig = {
    controls: [
        [
            // {
            //     type: FormFieldType.Number,
            //     label: 'totalExcAmount',
            //     name: 'Total Exc Tax',
            //     readonly: true,
            //     initialValue: '0.00',
            //     decimal: true,
            //     alignRight: true
            // },
            // {
            //     type: FormFieldType.Number,
            //     label: 'totalTax',
            //     name: 'Total Tax',
            //     readonly: true,
            //     initialValue: '0.00',
            //     decimal: true,
            //     alignRight: true
            // },
            {
                type: FormFieldType.Number,
                label: 'totalClaimAmount',
                name: 'Total Amount',
                readonly: true,
                initialValue: '0.00',
                decimal: true,
                alignRight: true
            }
        ]
    ]
}


