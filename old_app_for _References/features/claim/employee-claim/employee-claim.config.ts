import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";




export const EmployeeClaimHeader: HeaderDataConfig = {
    idProp: 'systemId',
    api: '/employeeClaimHeaders',
    title: 'Employee Claim',
    autoGenerateField: 'claimNo',
    activityLogsTableCaption: 'TMYEmployee Claim Header',
    buttons: [
        {
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
        {
            label: 'Approved',
            name: 'Approved',
            icon: 'bi bi-check',
        },
        {
            label: 'ApprovalReject',
            name: 'Reject',
            icon: 'bi bi-x',
        },

    ],
    sections: [
        {
            title: 'General Information',
            controls: [
                [
                    { type: FormFieldType.TextBox, name: 'Claim No', label: 'claimNo', readonly: true },
                    { type: FormFieldType.TextBox, name: 'Employee No', label: 'employeeNo', readonly: true }
                ],
                [
                    { type: FormFieldType.TextBox, name: 'Employee Name', label: 'employeeName', readonly: true },
                    { type: FormFieldType.TextBox, name: 'Department', label: 'departmentCode', readonly: true },
                ],
                [
                    { type: FormFieldType.DateTime, name: 'Claim Date', label: 'claimDate', dateOnly: true },
                    { type: FormFieldType.TextBox, name: 'Claim Month', label: 'claimMonth' }
                ],
                [
                    { type: FormFieldType.TextBox, name: 'Approval Status', label: 'approvalStatus', readonly: true },
                    { type: FormFieldType.TextBox, name: 'Batch Status', label: 'batchStatus', readonly: true },
                ],

                [
                    { type: FormFieldType.TextBox, name: 'Approved By', label: 'approvedBy', apiUrl: '/portalUsers', bindValue: 'UserId', bindLabel: 'UserId', readonly: true },
                    { type: FormFieldType.TextBox, name: 'Created By', label: 'createdBy', readonly: true },
                ],
                [
                     { type: FormFieldType.TextBox, name: 'Representor Id', label: 'representorId', dateOnly: true },
                    { type: FormFieldType.TextBox, name: 'Reject Reason', label: 'rejectReason', readonly: true }
                ],
                [
                    { type: FormFieldType.DateTime, name: 'Created Date', label: 'creationDate', dateOnly: true },
                    { type: FormFieldType.Checkbox, name: 'Due Claim', label: 'dueClaim', readonly: true },
                ],
                [
                   { type: FormFieldType.TextArea, name: 'Remarks', label: 'remarks', },
                ],
            ]
        }
    ],
    removeUnicodeCharFields: ['batchStatus', 'approvalStatus']
};

EmployeeClaimHeader.controls = (EmployeeClaimHeader.sections ?? []).flatMap(section => section.controls);



export const EmployeeClaimLime: LineDataConfig = {
    idProp: 'systemId',
    headerPKProp: 'claimNo',
    lineFKProp: 'claimNo',
    api: '/employeeClaimLines',
    includeHeaderId: true,
    defaultLines: 0,
    showStatusColumn: true,
    statusReasonField: 'batchStatus',
    statusField: 'return',
    activityLogsTableCaption: 'TMYEmployee Claim Line',
    showLinePopup: true,
    viewLinePopup: true,
    showLineAttachments: true,
    isShowUploaderFile: true,



    buttons: [
        {
            label: 'resubmitLine',
            name: 'Resubmit Line',
            icon: 'bi bi-send'
        },
        {
            label: 'getRejectLine',
            name: 'Get Reject Lines',
            icon: 'bi bi-box-arrow-in-left'
        },
        {
            name: 'Reject Line',
            label: 'RejectLine',
            icon: 'bi bi-x',
        }
    ],
    controls: [

        /* =========================
           BASIC INFORMATION
        ========================== */

        {
            type: FormFieldType.DropDown,
            label: 'expenseType',
            name: 'Expense Type',
            required: true,
            showRequiredSymbol: true,
            section: 'Basic'
        },
        {
            type: FormFieldType.TextBox,
            label: 'receiptNo',
            name: 'Receipt No',
            showRequiredSymbol: true,
            section: 'Basic'
        },
        {
            type: FormFieldType.DateTime,
            label: 'receiptDate',
            name: 'Receipt Date',
            dateOnly: true,
            systemUpdate: true,
            showRequiredSymbol: true,
            section: 'Basic'
        },
        {
            type: FormFieldType.TextBox,
            label: 'receiptIssueBy',
            name: 'Receipt Issue By',
            showRequiredSymbol: true,
            section: 'Basic'
        },
        {
            type: FormFieldType.TextBox,
            label: 'description',
            name: 'Description',
            showRequiredSymbol: true,
            section: 'Basic'
        },
        {
            type: FormFieldType.Number,
            label: 'amount',
            name: 'Amount',
            decimal: true,
            showRequiredSymbol: true,
            section: 'Basic'
        },

        /* =========================
           TRAVEL DETAILS
        ========================== */

        {
            type: FormFieldType.TextBox,
            label: 'fromLocation',
            name: 'From Location',
            hideInLine: true,
            showRequiredSymbol: true,
            section: 'Travel'
        },
        {
            type: FormFieldType.TextBox,
            label: 'toLocation',
            name: 'To Location',
            hideInLine: true,
            showRequiredSymbol: true,
            section: 'Travel'
        },
        {
            type: FormFieldType.Number,
            label: 'km',
            name: 'KM',
            decimal: true,
            hideInLine: true,
            section: 'Travel'
        },
        {
            type: FormFieldType.DropDown,
            label: 'typeOfTransportation',
            name: 'Type of Transportation',
            hideInLine: true,
            section: 'Travel',
            autoSave: false,
            items: [
                { value: '', name: '' },
                { value: 'Motorcycle', name: 'Motorcycle' },
                { value: 'Vehicle', name: 'Car' }
            ],
            bindLabel: 'name',
            bindValue: 'value',
            showRequiredSymbol: true,
        },
        {
            type: FormFieldType.TextBox,
            label: 'motorcycleMileageRate',
            name: 'Motorcycle Mileage Rate (RM/KM)',
            readonly: true,
            decimal: true,
            hideInLine: true,
            section: 'Travel'
        },
        {
            type: FormFieldType.TextBox,
            label: 'carMileageRate',
            name: 'Car Mileage Rate (RM/KM)',
            readonly: true,
            decimal: true,
            hideInLine: true,
            section: 'Travel'
        },

        /* =========================
           PAYMENT INFORMATION
        ========================== */

        {
            type: FormFieldType.DropDown,
            label: 'paymentMethod',
            name: 'Payment Method',
            apiUrl: '/paymentMethods?$filter=showInPortal eq true',
            bindLabel: 'code',
            bindValue: 'code',
            hideInLine: true,
            section: 'Payment'
        },
        {
            type: FormFieldType.TextBox,
            label: 'cardNo',
            name: 'Pay Card No',
            hideInLine: true,
            section: 'Payment'
        },

        /* =========================
           PARTICIPANTS (PAX)
        ========================== */

        {
            type: FormFieldType.Number,
            label: 'noOfPAX',
            name: 'Number of PAX',
            decimal: true,
            hideInLine: true,
            readonly: true,
            showRequiredSymbol: true,
            section: 'PAX'
        },
        {
            type: FormFieldType.Action,
            label: 'managePax',
            name: 'Manage PAX',
            actionStyle: 'button',
            actionIcon: 'bi bi-people',
            hideInLine: true,
            showRequiredSymbol: true,
            section: 'PAX'
        },
        {
            type: FormFieldType.Number,
            label: 'paxValue',
            name: 'PAX Value',
            decimal: true,
            hideInLine: true,
            readonly: true,
            showRequiredSymbol: true,
            section: 'PAX'
        },
        {
            type: FormFieldType.Checkbox,
            label: 'paxEnabled',
            name: 'PAX Enable',
            hideInLine: true,
            readonly: true,
            showRequiredSymbol: true,
            section: 'PAX'
        },

        /* =========================
           BILLING / CLIENT
        ========================== */

        {
            type: FormFieldType.Checkbox,
            label: 'Chargeable',
            name: 'Chargeable?',
            spacialClass: 'checkbox-col',
            section: 'Billing'
        },
        {
            type: FormFieldType.TextBox,
            label: 'clientName',
            name: 'Chargeable Client Name',
            hideInLine: true,
            section: 'Billing'
        },
        {
            type: FormFieldType.TextBox,
            label: 'job',
            name: 'Job',
            hideInLine: true,
            section: 'Billing'
        },

        /* =========================
           CLAIM STATUS
        ========================== */

        {
            type: FormFieldType.TextBox,
            label: 'approvalStatus',
            name: 'Approval Status',
            readonly: true,
            section: 'Status'
        },
        {
            type: FormFieldType.TextBox,
            label: 'batchStatus',
            name: 'Batch Status',
            readonly: true,
            hidden: true,
            section: 'Status'
        },
        {
            type: FormFieldType.Checkbox,
            label: 'return',
            name: 'Reject',
            readonly: true,
            section: 'Status'
        },
        {
            type: FormFieldType.TextBox,
            label: 'returnReason',
            name: 'Reject Reason',
            readonly: true,
            section: 'Status'
        },

        /* =========================
           CLAIM RULES
        ========================== */

        {
            type: FormFieldType.Checkbox,
            label: 'dueClaim',
            name: 'Due Claim',
            readonly: true,
            section: 'Rules'
        },
        {
            type: FormFieldType.TextBox,
            label: 'dueClaimReason',
            name: 'Due Claim Reason',
            section: 'Rules'
        },

        /* =========================
           ATTACHMENTS
        ========================== */

        {
            type: FormFieldType.FileUpload,
            label: 'attachment',
            name: 'Attachment',
            hideInLine: true,
            hidden: true,
            section: 'Attachment'
        }

    ],
    removeUnicodeCharFields: ['approvalStatus', 'batchStatus', 'returnReason']
}

export const EmployeeClaimCalculation: CalculationSectionConfig = {
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
