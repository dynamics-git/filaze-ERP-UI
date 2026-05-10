import { CalculationSectionConfig } from "../../../core/models/shared/calculation-section.config";
import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";




export const PostedEmployeeClaimHeader: HeaderDataConfig = {
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
            name: 'Cancel Approval Request',
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
    ],
    sections: [
        {
            title: 'Identification',
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
                ],

                [
                    { type: FormFieldType.TextBox, name: 'Approved By', label: 'approvedBy', apiUrl: '/portalUsers', bindValue: 'UserId', bindLabel: 'UserId' },
                    { type: FormFieldType.TextBox, name: 'Batch Status', label: 'batchStatus', readonly: true },
                ],
                [
                    { type: FormFieldType.TextArea, name: 'Remarks', label: 'remarks', },
                    { type: FormFieldType.TextBox, name: 'Created By', label: 'createdBy', }
                ],
                [
                    { type: FormFieldType.DateTime, name: 'Created Date', label: 'creationDate', dateOnly: true },
                    // { type: FormFieldType.DateTime, name: 'Payment Date', label: 'paymentDate', }
                ],
            ]
        }
    ],
    removeUnicodeCharFields: ['batchStatus', 'approvalStatus']
};

PostedEmployeeClaimHeader.controls = (PostedEmployeeClaimHeader.sections ?? []).flatMap(section => section.controls);



export const PostedEmployeeClaimLime: LineDataConfig = {
    idProp: 'systemId',
    headerPKProp: 'claimNo',
    lineFKProp: 'claimNo',
    api: '/employeeClaimLines',
    includeHeaderId: true,
    defaultLines: 2,
    showStatusColumn: true,
    statusReasonField: 'batchStatus',
    statusField: 'return',
    activityLogsTableCaption: 'TMYEmployee Claim Line',
    showLinePopup: true,

    buttons: [
        {
            label: 'resubmitLine',
            name: 'Resubmit Line',
            icon: 'bi bi-send'
        },
    ],
    controls: [

        {
            type: FormFieldType.DropDown,
            label: 'expenseType',
            name: 'Expense Type',
            required: true,
            isNotVisiableSubPopup: true
        },

        {
            type: FormFieldType.TextBox,
            label: 'receiptNo',
            name: 'Receipt No',
            isNotVisiableSubPopup: true
        },
        {
            type: FormFieldType.DateTime,
            label: 'receiptDate',
            name: 'Receipt Date',
            dateOnly: true,
            // defaultSystemDate: true,
            isNotVisiableSubPopup: true,
            systemUpdate: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'approvalStatus',
            name: 'Approval Status',
            readonly: true,
            isNotVisiableSubPopup: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'batchStatus',
            name: 'Batch Status',
            readonly: true,
            hidden: true,
            
        },
        {
            type: FormFieldType.TextBox,
            label: 'description',
            name: 'Description',
            isNotVisiableSubPopup: true
        },
        {
            type: FormFieldType.TextBox,
            label: 'fromLocation',
            name: 'From Location',
            
        },
        {
            type: FormFieldType.TextBox,
            label: 'toLocation',
            name: 'To Location',
            
        },
        {
            type: FormFieldType.Number,
            label: 'km',
            name: 'KM',
            decimal: true,
            
        },
        {
            type: FormFieldType.DropDown,
            label: 'typeOfTransportation',
            name: 'Type of Transportation',
            items: [
                {
                    value: '',
                    name: ''
                },
                {
                    value: 'Motorcycle',
                    name: 'Motorcycle'
                }, {
                    value: 'Vehicle',
                    name: 'Car'
                }

            ],
            bindLabel: 'name',
            bindValue: 'value',
            
        },
        {
            type: FormFieldType.DropDown,
            label: 'paymentMethod',
            name: 'Payment Method',
            apiUrl: '/paymentMethods?$filter=showInPortal eq true',
            bindLabel: 'code',
            bindValue: 'code',
            
        },
        {
            type: FormFieldType.TextBox,
            label: 'cardNo',
            name: 'Pay Card No',
            
        },
        {
            type: FormFieldType.Number,
            label: 'amount',
            name: 'Amount',
            decimal: true,
            

        },
        // {
        //     type: FormFieldType.Number,
        //     label: 'amount',
        //     name: 'Amount',
        //     decimal: true,
        //     isNotVisiableSubPopup: true,
        //     readonly: true
        // },
        { type: FormFieldType.Checkbox, label: 'return', name: 'Reject', readonly: true },
        { type: FormFieldType.TextBox, label: 'returnReason', name: 'Reject Reason', readonly: true },
        // {
        //     type: FormFieldType.Checkbox,
        //     label: 'attachment',
        //     name: 'Attachment',
        //     readonly: true,
        //     isNotVisiableSubPopup: true
        // },
        {
            type: FormFieldType.TextBox,
            label: 'clientName',
            name: 'Client Name',
            
        },
        {
            type: FormFieldType.TextBox,
            label: 'job',
            name: 'Job',
            
        },

        {
            type: FormFieldType.Checkbox,
            label: 'Chargeable',
            name: 'Chargeable?',
            isNotVisiableSubPopup: true,
            spacialClass: 'checkbox-col'
        },
        {
            type: FormFieldType.TextBox,
            label: 'ClientName',
            name: 'Chargeable Client Name',
            isNotVisiableSubPopup: true,
        },
        {
            type: FormFieldType.FileUpload,
            label: 'attachment',
            name: 'Attachment',
            
        },
    ],
    removeUnicodeCharFields: ['approvalStatus', 'batchStatus', 'returnReason']
}

export const PostedEmployeeClaimCalculation: CalculationSectionConfig = {
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
