import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";




export const ClaimReviewHeader: HeaderDataConfig = {
    idProp: 'systemId',
    api: '/claimReviewHeaders',
    title: 'Finance Claim Review',
    autoGenerateField: 'batchNo',
    buttons: [
        // { name: 'Edit', label: 'edit', icon: 'bi bi-pencil-square' },
        // { name: 'Update Remark', label: 'updateRemark', icon: 'bi bi-chat-square-text' },
        { name: 'Refresh', label: 'recalculate', icon: 'bi bi-arrow-repeat' },
        { name: 'Ready for Payment Batch', label: 'ReadyForBatch', icon: 'bi bi-cash-stack' }
    ],
    sections: [
        {
            title: 'Identification',
            controls: [
                [{ type: FormFieldType.TextBox, name: 'Batch No', label: 'batchNo', readonly: true },
                { type: FormFieldType.TextBox, name: 'Batch Status', label: 'batchStatus' }
                ],
                [
                    { type: FormFieldType.DateTime, name: 'Created Date', label: 'createdDate', defaultSystemDate: true, dateOnly: true },
                    // { type: FormFieldType.TextBox, name: 'Created By', label: 'createdBy', readonly: true }
                    { type: FormFieldType.TextArea, name: 'Remarks', label: 'remarks' }
                ]
            ]
        }
    ],
    removeUnicodeCharFields: ['batchStatus']
};

ClaimReviewHeader.controls = (ClaimReviewHeader.sections ?? []).flatMap(section => section.controls);



export const ClaimReviewLime: LineDataConfig = {
    idProp: 'systemId',
    headerPKProp: 'batchNo',
    lineFKProp: 'batchNo',
    api: '/claimReviewLines',
    includeHeaderId: true,
    defaultLines: 1,
    showStatusColumn: true,
    statusReasonField: 'batchStatus',
    statusField: 'return',
    showCreate: false,
    showLineAttachments: true,
    lineAttachmentDeletePermission: false,
    relatedDocumentNoProp: 'sourceClaimNo',
    relatedDocumentType: 'Employee Claim',
    relatedLineNoProp: 'sourceLineNo',
    isShowUploaderFile: true,
    buttons: [
        // { name: 'Reload Previous Month', label: 'reloadPreviousMonth', icon: 'bi bi-arrow-counterclockwise' },
        { name: 'Reject', label: 'Return', icon: 'bi bi-flag' },
        { name: 'Accept Resubmission', label: 'AcceptResubmission', icon: 'bi bi-check-all' }
    ],
    controls: [
        { type: FormFieldType.TextBox, label: 'claimNo', name: 'Claim Batch No', readonly: true },
        { type: FormFieldType.TextBox, label: 'expenseType', name: 'Expense Type', readonly: true },
        { type: FormFieldType.TextBox, label: 'employeeNo', name: 'Employee No', readonly: true },
        { type: FormFieldType.TextBox, label: 'employeeName', name: 'Employee Name', readonly: true },
        { type: FormFieldType.TextBox, label: 'description', name: 'Description' },
        { type: FormFieldType.TextBox, label: 'batchStatus', name: 'Batch Status', readonly: true, hidden: true,  },
        {
            type: FormFieldType.DropDown,
            label: 'paymentMethod',
            name: 'Payment Method',
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
        { type: FormFieldType.Number, label: 'amount', name: 'Amount', decimal: true },
        // {
        //     type: FormFieldType.DropDown,
        //     label: 'glCode',
        //     name: 'G/L Code',
        //     apiUrl: '/glAccountClaimEntries',
        //     bindValue: 'No',
        //     displayFormat: '[No] - [Name]'
        // },
        { type: FormFieldType.Checkbox, label: 'return', name: 'Reject', readonly: true },
        { type: FormFieldType.TextBox, label: 'returnReason', name: 'Reject Reason', readonly: true },
        { type: FormFieldType.TextBox, label: 'remarks', name: 'Remarks', },
        //{ type: FormFieldType.Checkbox, label: 'recalculate', name: 'Recalculate?', },
        // {
        //     type: FormFieldType.DropDown, label: 'status', name: 'Status', items: [
        //         {
        //             value: '',
        //             name: ''
        //         },
        //         {
        //             value: 'Draft',
        //             name: 'Draft'
        //         },
        //         {
        //             value: 'Approved',
        //             name: 'Approved'
        //         },
        //         {
        //             value: 'Rejected',
        //             name: 'Rejected'
        //         }, {
        //             value: 'Pending',
        //             name: 'Pending'
        //         },
        //     ],
        //     bindLabel: 'name',
        //     bindValue: 'value',
        // },
        // {
        //     type: FormFieldType.Checkbox,
        //     label: 'inBatch',
        //     name: 'In Batch',
        //     // items: [
        //     //     { value: '', name: '' },
        //     //     { value: 'Yes', name: 'Yes' },
        //     //     { value: 'No', name: 'No' },
        //     // ],
        //     // bindLabel: 'name',
        //     // bindValue: 'value',
        // },
        // {
        //     type: FormFieldType.DropDown,
        //     label: 'approvalStatus',
        //     name: 'Approval Status',
        //     items: [
        //         { value: '', name: '' },
        //         { value: 'Approved', name: 'Approved' },
        //         { value: 'Rejected', name: 'Rejected' },
        //         { value: 'Pending', name: 'Pending' },
        //     ],
        //     bindLabel: 'name',
        //     bindValue: 'value',
        // },
        // {
        //     type: FormFieldType.DropDown,
        //     label: 'paidStatus',
        //     name: 'Paid Status',
        //     items: [
        //         { value: '', name: '' },
        //         { value: 'Paid', name: 'Paid' },
        //         { value: 'Unpaid', name: 'Unpaid' },
        //     ],
        //     bindLabel: 'name',
        //     bindValue: 'value',
        // },
        { type: FormFieldType.TextBox, label: 'batchNo', name: 'Batch No', },
        // { type: FormFieldType.TextBox, label: 'paymentBatchNo', name: 'Payment Batch No', },
    ],
    removeUnicodeCharFields: ['batchStatus', 'paymentMethod', 'returnReason']
}


export const ClaimReviewCalculation: CalculationSectionConfig = {
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

